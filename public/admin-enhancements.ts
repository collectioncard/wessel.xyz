const originalProjects = new Map();
const escapeText = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
  const method = init.method || (input instanceof Request ? input.method : 'GET');
  if (requestUrl === '/api/projects' && method === 'GET') {
    const response = await nativeFetch(input, init);
    const projects = await response.clone().json();
    projects.forEach(project => {
      if (!project.draft_payload) return;
      try {
        const draft = JSON.parse(project.draft_payload);
        originalProjects.set(project.id, structuredClone(project));
        Object.assign(project, draft, { id: project.id, published: true, has_draft: true });
      } catch { /* Leave malformed draft data out of the editor. */ }
    });
    return new Response(JSON.stringify(projects), { status: response.status, headers: response.headers });
  }
  if (requestUrl === '/api/projects' && method === 'POST' && init.body) {
    const payload = JSON.parse(String(init.body));
    const original = originalProjects.get(payload.id);
    if (original?.published && !payload.published) {
      return nativeFetch(`/api/projects/${payload.id}/draft`, { ...init, body: JSON.stringify(payload) });
    }
    const response = await nativeFetch(input, init);
    if (original?.published && payload.published && response.ok) {
      await nativeFetch(`/api/projects/${payload.id}/clear-draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    }
    return response;
  }
  return nativeFetch(input, init);
};

function bodyHtml(project) {
  try { return JSON.parse(project.body || '[]').map(block => block.html || '').join('\n'); } catch { return ''; }
}

function showDiff(project) {
  const live = originalProjects.get(project.id);
  if (!live) return;
  let draft;
  try { draft = JSON.parse(project.draft_payload); } catch { return; }
  const oldLines = bodyHtml(live).split('\n');
  const newLines = bodyHtml(draft).split('\n');
  const lines = [];
  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i += 1) {
    if (oldLines[i] === newLines[i]) lines.push(`  ${oldLines[i] || ''}`);
    else {
      if (oldLines[i]) lines.push(`- ${oldLines[i]}`);
      if (newLines[i]) lines.push(`+ ${newLines[i]}`);
    }
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'diff-dialog';
  dialog.innerHTML = `<div class="diff-header"><h2>Draft changes</h2><button class="text-button">Close ✕</button></div><p>Red lines are live content. Green lines are in the pending draft.</p><pre>${escapeText(lines.join('\n'))}</pre>`;
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog); dialog.showModal();
}

const observer = new MutationObserver(() => {
  document.querySelectorAll<HTMLElement>('.project-row-wrap').forEach(row => {
    const button = row.querySelector<HTMLElement>('[data-id]');
    if (!button || row.dataset.enhanced) return;
    const project = originalProjects.get(Number(button.dataset.id));
    if (!project?.draft_payload) return;
    row.dataset.enhanced = 'true';
    const status = row.querySelector('.status');
    if (status) status.textContent = 'Published · Draft changes';
    const diff = document.createElement('button');
    diff.className = 'diff-project secondary'; diff.textContent = 'View changes';
    diff.onclick = event => { event.stopPropagation(); showDiff(project); };
    row.append(diff);
  });
});
observer.observe(document.body, { childList: true, subtree: true });
