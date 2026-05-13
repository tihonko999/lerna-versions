export jira_issue_id=$(grep -o -E "(RLS+-[0-9]+)" <<< $(git log -1 --oneline))

if [ -z "$jira_issue_id" ]; then
  echo 'No jira issue id found';
  exit;
fi

yarn publish:versions --message "chore: publish versions $jira_issue_id"
