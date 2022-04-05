import { Search} from './search/search'
import { get_org_repo } from './utils/utils'

(async () => {
  const [org, repo] = get_org_repo()

  let search = new Search(
    process.env.ES_ENDPOINT || "http://localhost:9200",
    process.env.GITHUB_TOKEN,
    org,
    repo
  )
  search.regist()
})();
