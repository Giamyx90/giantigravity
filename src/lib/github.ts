import { Octokit } from '@octokit/rest';

export function getOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

export async function listUserRepos(token: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 50,
  });
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    private: r.private,
    default_branch: r.default_branch,
    description: r.description,
  }));
}

export async function listRepoBranches(token: string, owner: string, repo: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.repos.listBranches({
    owner,
    repo,
    per_page: 50,
  });
  return data.map((b) => b.name);
}

export async function listDirectory(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  dirPath: string = ''
) {
  const octokit = getOctokit(token);
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: dirPath,
      ref: branch,
    });

    if (Array.isArray(data)) {
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type, // 'file' | 'dir'
        size: item.size,
      }));
    } else {
      return [{ name: data.name, path: data.path, type: data.type, size: data.size }];
    }
  } catch (err: any) {
    if (err.status === 404) {
      throw new Error(`Directory o percorso non trovato: "${dirPath}" sul branch "${branch}".`);
    }
    throw err;
  }
}

export async function readFileContent(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string
): Promise<{ content: string; sha: string }> {
  const octokit = getOctokit(token);
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });

    if (Array.isArray(data)) {
      throw new Error(`"${filePath}" è una directory, non un file.`);
    }

    if ('content' in data && data.content) {
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      return { content: decoded, sha: data.sha };
    }

    throw new Error(`Impossibile leggere il contenuto del file: ${filePath}`);
  } catch (err: any) {
    if (err.status === 404) {
      throw new Error(`File non trovato: "${filePath}" nel branch "${branch}".`);
    }
    throw err;
  }
}

export async function searchCode(
  token: string,
  owner: string,
  repo: string,
  query: string
) {
  const octokit = getOctokit(token);
  const q = `${query} repo:${owner}/${repo}`;
  const { data } = await octokit.search.code({
    q,
    per_page: 15,
  });

  return data.items.map((item) => ({
    name: item.name,
    path: item.path,
  }));
}

export async function saveFileContent(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  newContent: string,
  commitMessage: string
) {
  const octokit = getOctokit(token);

  let existingSha: string | undefined = undefined;
  try {
    const existing = await readFileContent(token, owner, repo, branch, filePath);
    existingSha = existing.sha;
  } catch (e) {
    // File doesn't exist yet, it's a new file
  }

  const encodedContent = Buffer.from(newContent, 'utf-8').toString('base64');

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: commitMessage || `Update ${filePath} via Giantigravity`,
    content: encodedContent,
    branch,
    sha: existingSha,
  });

  return {
    commitSha: data.commit.sha,
    commitUrl: data.commit.html_url,
    content: data.content,
  };
}

export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  newBranch: string,
  baseBranch: string = 'main'
) {
  const octokit = getOctokit(token);
  
  // Get base branch ref
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });

  // Create new ref
  const { data: newRef } = await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranch}`,
    sha: refData.object.sha,
  });

  return newRef;
}

export async function createPullRequest(
  token: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string = 'main'
) {
  const octokit = getOctokit(token);
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head,
    base,
  });
  return {
    number: data.number,
    html_url: data.html_url,
    title: data.title,
  };
}
