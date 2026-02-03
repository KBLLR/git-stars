import { Repo } from '../types';

interface RepoTableProps {
  repos: Repo[];
}

export function RepoTable({ repos }: RepoTableProps) {
  return (
    <table className="log-table repo-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Author</th>
          <th>Description</th>
          <th>Languages</th>
          <th>Topics</th>
          <th>Stars</th>
          <th>Forks</th>
          <th>Open Issues</th>
          <th>Starred On</th>
          <th>Last Updated</th>
        </tr>
      </thead>
      <tbody>
        {repos.map((repo, idx) => (
          <tr key={`${repo.author}-${repo.name}-${idx}`}>
            <td>{repo.name}</td>
            <td>{repo.author}</td>
            <td>{repo.description}</td>
            <td>
              {repo.languages.map((l) => `${l.language} (${l.percentage})`).join(', ') || 'N/A'}
            </td>
            <td>{repo.topics.join(', ') || 'None'}</td>
            <td>{repo.stars}</td>
            <td>{repo.forks}</td>
            <td>{repo.open_issues}</td>
            <td>{repo.date}</td>
            <td>{repo.last_updated}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
