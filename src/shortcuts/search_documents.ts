import { app } from '../bolt/bolt'
import { Search } from '../search/search'
import { get_org_repo } from '../utils/utils'
const sprintf = require('sprintf-js').sprintf;

const [org, repo] = get_org_repo()
const search = new Search(
  process.env.ES_ENDPOINT || "http://localhost:9200",
  process.env.GITHUB_TOKEN,
  org,
  repo
)

function strip_individual_info(txt) {
  // x.x.x.x:y
  txt = txt.replaceAll(/((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]):[0-9]+/g, '');
  // x.x.x.x
  txt = txt.replaceAll(/((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])/g, '');
  // gitxxxx.com
  txt = txt.replaceAll(/git[\\.\\-a-z0-9]+/g, '');
  // host:y
  txt = txt.replaceAll(/[a-zA-Z0-9\\.\\-]+:[0-9]+/g, '');
  return txt
}

export default function() {
  app.action('new_document', async ({ ack }) => {
    ack();
  });
  app.shortcut('search_document', async ({ shortcut, ack, logger }) => {
    ack();

    logger.info(shortcut)
    let txt = shortcut.message.text;
    if (!txt) {
      if (shortcut.message.attachments[0]["text"]) {
        txt = shortcut.message.attachments[0]["text"]
      }  else {
        txt = shortcut.message.attachments[0]["title"]
      }
    }
    const urljoin = require('url-join');
    txt = strip_individual_info(txt)
    logger.info("search keyword:", txt)
    const branch = await search.default_branch()
    const new_doc_url = new URL("/new-document", (process.env.ENDPOINT || "http://localhost:3000"))
    new_doc_url.searchParams.append('message', encodeURI(txt))
    new_doc_url.searchParams.append('user', encodeURI(shortcut.user.username))
    new_doc_url.searchParams.append('branch', encodeURI(branch))

    const result = await search.search(txt)
    const blocks: any[] = [];
    blocks.push (
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "検索結果",
          "emoji": true
        },
      }
    )

    if(result.length == 0) {
      blocks.push(
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "該当なし"
            }
          ]
        })
    } else {
      const elements: any[] = [];
      for(const r of result) {
        elements.push({
          "type": "mrkdwn",
          "text": sprintf(":page_facing_up: <%s|%s>", urljoin(process.env.GITHUB_REPO, "/blob", branch, encodeURI(r["_source"]["path"])), r["_source"]["path"])
        }
        )
      }
      blocks.push(
        {
          "type": "context",
          "elements":  elements
        }
      )

    }

    blocks.push({
      "type": 'section',
      "text": {
        "type": 'mrkdwn',
        "text": '新しくドキュメントを登録する'
      },
      "accessory": {
        "type": 'button',
        "text": {
          "type": 'plain_text',
          "text": '作成',
        },
        "action_id": "new_document",
        "url": new_doc_url.href
      }
    })
    try {
      const result = await app.client.chat.postMessage({
        user: shortcut.user.id,
        channel: shortcut.channel.id,
        thread_ts: shortcut.message.ts,
        "text": "操作を選択してください",
        "blocks": blocks,
      });
      logger.info(result);
    }
    catch (error) {
      logger.error(error);
    }
  });
}
