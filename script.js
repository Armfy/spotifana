document.addEventListener('DOMContentLoaded', () => 
  fetch('data.json')
    .then(response => response.json())
    .then(tracks => {
      [generateCharts, populateSongsTable, populateSongsCards, setupSearch, 
       setupSorting, setupModalListener, AlbumPopulaire].forEach(fn => fn(tracks));
    })
    .catch(err => console.error('Erreur lors du chargement des données :', err))
);

function getDefaultImage(size = 300) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#9e9e9e';
  ctx.font = `${size/4}px Arial`;
  ctx.textAlign = ctx.textBaseline = 'middle';
  ctx.fillText('♫', size/2, size/2);
  return canvas.toDataURL('image/png');
}

function generateCharts(tracks) {
  const artistCount = {}, genreCount = {};

  tracks.forEach(track => {
    track.artists.forEach(artist => artistCount[artist.name] = (artistCount[artist.name] || 0) + 1);
    
    const genres = track.album?.genres || [];
    if (genres.length) {
      genres.forEach(genre => genreCount[genre] = (genreCount[genre] || 0) + 1);
    } else if (track.artists) {
      track.artists.forEach(artist => {
        artist.genres?.forEach(genre => genreCount[genre] = (genreCount[genre] || 0) + 1);
      });
    }
  });

  const topArtists = Object.entries(artistCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  
  let genreArray = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
  if (genreArray.length > 7) {
    const otherCount = genreArray.slice(6).reduce((sum, genre) => sum + genre[1], 0);
    genreArray = genreArray.slice(0, 6);
    if (otherCount > 0) genreArray.push(['Autres', otherCount]);
  }

  renderArtistsChart(topArtists);
  renderGenresChart(genreArray);
}

function renderArtistsChart(data) {
  const ctx = document.getElementById('artistsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(item => item[0]),
      datasets: [{
        label: 'Nombre de morceaux',
        data: data.map(item => item[1]),
        backgroundColor: '#64B5F6',
        borderColor: '#1E88E5',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
      plugins: {
        title: { display: true, text: 'Top 10 des artistes (nombre de morceaux)', font: { size: 16 } },
        legend: { display: false }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function renderGenresChart(data) {
  const ctx = document.getElementById('genresChart').getContext('2d');
  const colors = ['#FF9AA2', '#74B9FF', '#FFD700', '#55EDBF', '#B19CD9', '#FF9966', '#A3D39C', '#CCCCCC'];
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map(item => item[0]),
      datasets: [{
        data: data.map(item => item[1]),
        backgroundColor: colors.slice(0, data.length),
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Distribution des genres musicaux', font: { size: 16 } },
        legend: { position: 'right', labels: { boxWidth: 15, padding: 10 } },
        tooltip: {
          callbacks: {
            label: context => {
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              return `${context.label || ''}: ${value} (${Math.round((value / total) * 100)}%)`;
            }}}
          },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function populateSongsTable(tracks) {
  const tbody = document.getElementById('songsTableBody');
  if (!tbody) return;
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
  
  tracks.forEach(track => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = track.name;
    row.appendChild(nameCell);

    const artistCell = document.createElement('td');
    artistCell.textContent = track.artists.map(a => a.name).join(', ');
    row.appendChild(artistCell);

    const albumCell = document.createElement('td');
    albumCell.textContent = track.album?.name || '';
    row.appendChild(albumCell);
    
    const actionCell = document.createElement('td');
    actionCell.className = 'text-center';
    
    const detailButton = document.createElement('button');
    detailButton.className = 'btn btn-sm btn-primary details-btn';
    detailButton.setAttribute('data-bs-toggle', 'modal');
    detailButton.setAttribute('data-bs-target', '#songDetailModal');
    detailButton.setAttribute('data-song-id', track.id);
    
    const icon = document.createElement('i');
    icon.className = 'bi bi-info-circle';
    detailButton.appendChild(icon);
    detailButton.appendChild(document.createTextNode(' Détails'));
    
    actionCell.appendChild(detailButton);
    row.appendChild(actionCell);
    tbody.appendChild(row);
  });
}

function populateSongsCards(tracks) {
  const container = document.getElementById('songCardContainer');
  if (!container) return;
  
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  tracks.forEach(track => {
    const item = document.createElement('div');
    item.className = 'list-group-item p-3 border-bottom';
    item.dataset.trackId = track.id;
    
    const row = document.createElement('div');
    row.className = 'row g-2';

    const titleCol = createInfoRow('Titre', track.name);

    const artistCol = createInfoRow('Artiste', track.artists.map(a => a.name).join(', '));

    const albumCol = createInfoRow('Album', track.album?.name || '');
    
    const buttonCol = document.createElement('div');
    buttonCol.className = 'col-12 mt-2';
    
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'd-flex justify-content-end';
    
    const detailButton = document.createElement('button');
    detailButton.className = 'btn btn-sm btn-primary details-btn';
    detailButton.dataset.bsToggle = 'modal';
    detailButton.dataset.bsTarget = '#songDetailModal';
    detailButton.dataset.songId = track.id;
    
    const icon = document.createElement('i');
    icon.className = 'bi bi-info-circle';
    
    detailButton.appendChild(icon);
    detailButton.appendChild(document.createTextNode(' Détails'));
    buttonWrapper.appendChild(detailButton);
    buttonCol.appendChild(buttonWrapper);
    
    row.appendChild(titleCol);
    row.appendChild(artistCol);
    row.appendChild(albumCol);
    row.appendChild(buttonCol);
    item.appendChild(row);
    container.appendChild(item);
  });
}

function createInfoRow(label, value) {
  const col = document.createElement('div');
  col.className = 'col-12';
  
  const flex = document.createElement('div');
  flex.className = 'd-flex justify-content-between align-items-center';
  
  const strong = document.createElement('strong');
  strong.textContent = label;
  
  const span = document.createElement('span');
  span.textContent = value;
  
  flex.appendChild(strong);
  flex.appendChild(span);
  col.appendChild(flex);
  
  return col;
}

function setupModalListener(tracks) {
  document.getElementById('songDetailModal').addEventListener('show.bs.modal', event => {
    const track = tracks.find(t => t.id === event.relatedTarget.getAttribute('data-song-id'));
    if (!track) return;
    
    document.getElementById('modalSongTitle').textContent = track.name;
    document.getElementById('modalSongDuration').textContent = formatDuration(track.duration_ms);
    document.getElementById('modalSongPopularity').textContent = track.popularity || 0;
    document.getElementById('modalTrackNumber').textContent = track.track_number || 1;
    document.getElementById('modalExplicit').textContent = track.explicit ? 'Oui' : 'Non';
    
    if (track.album) {
      const albumImage = track.album.images?.length ? track.album.images[0].url : getDefaultImage(300);
      const modalAlbumImage = document.getElementById('modalAlbumImage');
      modalAlbumImage.src = albumImage;
      modalAlbumImage.alt = "Album-cover-" + (track.album.name || "").replace(/\s+/g, "-");
      
      document.getElementById('modalReleaseDate').textContent = formatDate(track.album.release_date);
      document.getElementById('modalAlbumPopularity').textContent = 'Popularité: ' + (track.album.popularity || 0) + '/100';
    }
    
    const audioElement = document.getElementById('modalAudioPreview');
    audioElement.src = track.preview_url || '';
    audioElement.style.display = track.preview_url ? 'block' : 'none';

    const artistsListElement = document.getElementById('modalArtistsList');
    while (artistsListElement.firstChild) {
      artistsListElement.removeChild(artistsListElement.firstChild);
    }
    
    const artistTitle = document.createElement('strong');
    artistTitle.textContent = 'Artistes :';
    artistsListElement.appendChild(artistTitle);
    
    const artistsList = document.createElement('ul');
    artistsList.className = 'list-unstyled mt-1';
    
    track.artists.forEach(artist => {
      const li = document.createElement('li');
      li.className = 'd-flex align-items-center mb-2';
      
      const img = document.createElement('img');
      img.src = artist.images?.length ? artist.images[0].url : getDefaultImage(30);
      img.className = 'rounded-circle me-2';
      img.width = 30;
      img.height = 30;
      img.onerror = function() { this.src = getDefaultImage(30); };
      const infoDiv = document.createElement('div');
      const nameDiv = document.createElement('div');
      nameDiv.textContent = artist.name;
      const smallInfo = document.createElement('small');
      smallInfo.className = 'text-muted';
      smallInfo.textContent = `Popularité: ${artist.popularity || 0}/100`;
      
      if (artist.followers?.total) {
        smallInfo.textContent += ` • ${artist.followers.total} followers`;
      }
      
      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(smallInfo);
      li.appendChild(img);
      li.appendChild(infoDiv);  
      artistsList.appendChild(li);
    });
    
    artistsListElement.appendChild(artistsList);
    
    const genresElement = document.getElementById('modalGenres');
    while (genresElement.firstChild) {
      genresElement.removeChild(genresElement.firstChild);
    }
    
    const genres = track.album?.genres || [];
    if (genres.length > 0) {
      genres.forEach(genre => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-secondary me-1 mb-1';
        badge.textContent = genre;
        genresElement.appendChild(badge);
      });
    } else {
      genresElement.textContent = 'Aucun genre disponible';
    }
    
    const spotifyLink = document.getElementById('modalSpotifyLink');
    spotifyLink.href = track.external_urls?.spotify || '#';
    spotifyLink.style.display = track.external_urls?.spotify ? 'inline-block' : 'none';
  });
}

function AlbumPopulaire(tracks) {
  const albums = {};
  tracks.forEach(track => {
    if (!track.album?.id) return;
    
    if (!albums[track.album.id]) {
      albums[track.album.id] = {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images,
        release_date: track.album.release_date,
        popularity: track.album.popularity || 0,
        trackCount: 0,
        artistNames: []
      };
    }
    
    albums[track.album.id].trackCount++;
    track.artists.forEach(artist => {
      if (!albums[track.album.id].artistNames.includes(artist.name)) {
        albums[track.album.id].artistNames.push(artist.name);
      }
    });
  });
  
  const container = document.getElementById('popularAlbums');
  if (!container) return;
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  Object.values(albums)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 12)
    .forEach(album => {
      const col = document.createElement('div');
      col.className = 'col';
      
      const card = document.createElement('div');
      card.className = 'card h-100 shadow-sm';
      
      const img = document.createElement('img');
      img.className = 'card-img-top';
      img.style.height = '200px';
      img.style.objectFit = 'cover';
      img.src = album.images?.length ? album.images[0].url : getDefaultImage(300);
      img.alt = `Album-cover-${(album.name || "").replace(/\s+/g, "-")}`;
      
      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
      
      const title = document.createElement('h5');
      title.className = 'card-title text-truncate';
      title.textContent = album.name;
      
      const artistText = document.createElement('p');
      artistText.className = 'card-text text-truncate';
      artistText.textContent = album.artistNames[0] || '';
      
      const dateText = document.createElement('p');
      dateText.className = 'card-text';
      
      const dateSmall = document.createElement('small');
      dateSmall.className = 'text-muted';
      dateSmall.textContent = formatDate(album.release_date);
      
      dateText.appendChild(dateSmall);
      
      const badgeContainer = document.createElement('div');
      badgeContainer.className = 'd-flex justify-content-between align-items-center';
      
      const tracksBadge = document.createElement('span');
      tracksBadge.className = 'badge bg-primary';
      tracksBadge.textContent = `${album.trackCount} titres`;
      
      const popularityBadge = document.createElement('span');
      popularityBadge.className = 'badge bg-success';
      popularityBadge.textContent = `${album.popularity}/100`;
      
      badgeContainer.appendChild(tracksBadge);
      badgeContainer.appendChild(popularityBadge);
      
      // Assembler tous les éléments
      cardBody.appendChild(title);
      cardBody.appendChild(artistText);
      cardBody.appendChild(dateText);
      cardBody.appendChild(badgeContainer);
      
      card.appendChild(img);
      card.appendChild(cardBody);
      
      col.appendChild(card);
      container.appendChild(col);
    });
}

function formatDuration(ms) {
  if (!ms) return '0:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.getDate() + ' ' + date.toLocaleString('fr-FR', { month: 'long' }) + ' ' + date.getFullYear();
}

function setupSearch() {
  ['searchInput', 'searchInputMobile'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('input', () => filterTracks(input.value.toLowerCase()));
  });
}

function filterTracks(term) {
  document.querySelectorAll('#songsTableBody tr').forEach(row => {
    const cells = row.cells;
    if (cells?.length >= 3) {
      const matches = [cells[0], cells[1], cells[2]].some(cell => 
        cell.textContent.toLowerCase().includes(term)
      );
      row.style.display = matches ? '' : 'none';
    }
  });
  
  document.querySelectorAll('#songCardContainer .list-group-item').forEach(card => {
    const elements = [
      card.querySelector('div:nth-child(1) span'),
      card.querySelector('div:nth-child(2) span'),
      card.querySelector('div:nth-child(3) span')
    ];
    
    if (elements.every(el => el)) {
      const matches = elements.some(el => 
        el.textContent.toLowerCase().includes(term)
      );
      card.style.display = matches ? '' : 'none';
    }
  });
}

function setupSorting() {
  document.querySelectorAll('.sortable').forEach(header => {
    header.style.cursor = 'pointer';
    
    header.addEventListener('click', function() {
      const colIndex = Array.from(this.parentNode.children).indexOf(this);
      const direction = this.dataset.sortDir === 'asc' ? 'desc' : 'asc';
      this.dataset.sortDir = direction;
      
      const tbody = document.getElementById('songsTableBody');
      Array.from(tbody.rows)
        .sort((a, b) => {
          const cellA = a.cells[colIndex].textContent.toLowerCase();
          const cellB = b.cells[colIndex].textContent.toLowerCase();
          return direction === 'asc' ? 
            cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        })
        .forEach(row => tbody.appendChild(row));
      
      document.querySelectorAll('.sortable').forEach(el => {
        el.classList.remove('text-primary');
        const existingIcon = el.querySelector('i');
        if (existingIcon) existingIcon.remove();
      });
      
      this.classList.add('text-primary');
      const icon = document.createElement('i');
      icon.className = direction === 'asc' ? 
        'bi bi-sort-alpha-down ms-1' : 'bi bi-sort-alpha-up ms-1';
      this.appendChild(icon);
    });
  });
}