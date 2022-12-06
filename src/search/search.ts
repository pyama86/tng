import { Octokit} from '@octokit/rest'

import { Client } from '@elastic/elasticsearch'
interface Document {
  title: string
  body: string
}

export class Search {
  client: Client
  _default_branch: string
  org: string
  repo: string
  sha: string
  octokit: Octokit
  static readonly alias_name: string  = "tng"
  constructor(es_endpoint: string, pta: string , org: string, repo: string) {
    this.client = new Client({ node: es_endpoint });
    this.org = org
    this.repo = repo

    this.octokit = new Octokit({
      auth: pta,
      baseUrl: process.env.GITHUB_API || "https://api.github.com"
    });
  }

  public async default_branch() {
    if(!this._default_branch || this._default_branch == "") {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.org,
        repo: this.repo,
      });

      this._default_branch = data.default_branch
    }
    return this._default_branch
  }

  async get_tree(){
    const {data} = await this.octokit.rest.git.getTree({
      owner: this.org,
      repo: this.repo,
      tree_sha: await this.default_branch(),
      recursive: "true",
    });
    return data
  }

  public async regist() {
    const tree = await this.get_tree()
    if(tree.sha == this.sha) {
      return
    }
    this.sha = tree.sha

    console.log( "updated repository sha:"+this.sha)
    const blobs = await tree.tree.filter(async t => {
      return t.type == "blob"
    })

    const index_name = "tng-" + Math.random().toString(32).substring(2)
    await this.client.indices.create({
      index: index_name,
      body: {
        settings: {
          analysis: {
            analyzer: {
              my_ja_analyzer: {
                type: "custom",
                tokenizer: "kuromoji_tokenizer",
                filter: [
                  "kuromoji_baseform",
                  "kuromoji_part_of_speech",
                  "ja_stop",
                  "kuromoji_number",
                  "kuromoji_stemmer"
                ]
              }
            }
          },
        },
        mappings: {
          properties: {
            title: {
              type: 'text',
              index: true,
              analyzer: "my_ja_analyzer"
            },
            body: {
              type: 'text',
              index: true,
              analyzer: "my_ja_analyzer"
            }

          }
        }
      }
    })
    for(const b of blobs) {
      const c = await this.octokit.rest.repos.getContent({
        mediaType: {
          format: "raw",
        },
        owner: this.org,
        repo: this.repo,

        path: b.path
      });
      try {
        await this.client.index({
          index: index_name,
          document: {
            path: b.path,
            body: c.data,
          }
        })
      } catch (e) {
        console.log(e);
      }
    }
    let old_index_name = ""
    if (await this.client.indices.existsAlias({
      name: Search.alias_name
    })) {
      const current_alias = await this.client.indices.getAlias({name: Search.alias_name})
      old_index_name = Object.keys(current_alias)[0]
    }

    await this.client.indices.putAlias({
      name: Search.alias_name,
      index: index_name
    })

    if(old_index_name != "" && await this.client.indices.exists({ index: old_index_name})) {
      await this.client.indices.delete({ index: old_index_name})
    }
  }

  public async search(keyword: string) {
    const result = await this.client.search<Document>({
      index: Search.alias_name,
      query: {
        match: { body: keyword },
      }
    })
    return result.hits.hits
  }
}
