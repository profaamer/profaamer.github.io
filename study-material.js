async function downloadProtectedMaterial(path, filename) {
  const user = await requireAuth();
  if (!user) return;

  const { data, error } = await supabaseClient.storage
    .from('study-materials')
    .download(path);

  if (error) {
    const message = document.getElementById('materialMessage');
    if (message) {
      message.textContent = 'Study material is not uploaded yet for this chapter.';
    } else {
      alert('Study material is not uploaded yet for this chapter.');
    }
    return;
  }

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || path.split('/').pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
