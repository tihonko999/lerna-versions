# export changed=$(yarn lerna changed --all --include-merged-tags)
# if [ -z "$changed" ]; then
#   echo 'No changed packages found';
#   exit;
# fi

export jira_issue_id=$(grep -o -E "(RLS+-[0-9]+)" <<< $(git log -1 --oneline))
if [ -z "$jira_issue_id" ]; then
  echo 'No jira issue id found';
  exit;
fi

# git tag -d $(git tag -l) >/dev/null && git fetch --tags --quiet
# git fetch origin main --quiet

# tags=$(git tag -l | grep $jira_issue_id)
# if [ ! -z "$tags" ]; then
#   xargs -n 1 git push -d origin <<< $tags
#   xargs -n 1 git tag -d <<< $tags
# fi

yarn publish:versions --message "chore: publish versions $jira_issue_id"
