
export function get_org_repo() {
  const arr_repo  = process.env.GITHUB_REPO.replace(/\/$/, '').split(/\//)
  return [arr_repo[arr_repo.length-2], arr_repo[arr_repo.length-1]]
}
