import { Search} from './search/search'
import { get_org_repo } from './utils/utils'

(async () => {
  const [org, repo] = get_org_repo()

  const search = new Search(
    process.env.ES_ENDPOINT || "http://localhost:9200",
    process.env.GITHUB_TOKEN,
    org,
    repo
  )

  while(true) {
    console.log( "check repository and regist index")
    await search.regist()
    await new Promise(resolve => setTimeout(resolve, 1200000))
  }
})();
