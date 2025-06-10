document.addEventListener('DOMContentLoaded', function () {
  fetch('data.json')
    .then(function(response) {
      return response.json();
    })
    .then(function(tracks) {
      generateCharts(tracks);
      populateSongsTable(tracks);
      setupSearch();
      setupSorting();
      document.getElementById('songCount').textContent = tracks.length;
      setupModalListener(tracks);
      AlbumPopulaire(tracks);
    })
    .catch(function(err) {
      console.error('Erreur lors du chargement des données :', err);
    });
});

function generateCharts(tracks) {
  var artistCount = {};
  var genreCount = {};

  for (var i = 0; i < tracks.length; i++) {
    var track = tracks[i];
    
    for (var j = 0; j < track.artists.length; j++) {
      var artistName = track.artists[j].name;
      if (artistCount[artistName]) {
        artistCount[artistName]++;
      } else {
        artistCount[artistName] = 1;
      }
    }

    if (track.album && track.album.genres && Array.isArray(track.album.genres)) {
      for (var k = 0; k < track.album.genres.length; k++) {
        var genre = track.album.genres[k];
        if (genreCount[genre]) {
          genreCount[genre]++;
        } else {
          genreCount[genre] = 1;
        }
      }
    }
    
    if ((!track.album || !track.album.genres || track.album.genres.length === 0) && track.artists) {
      for (var l = 0; l < track.artists.length; l++) {
        var artist = track.artists[l];
        if (artist.genres && Array.isArray(artist.genres)) {
          for (var m = 0; m < artist.genres.length; m++) {
            var artistGenre = artist.genres[m];
            if (genreCount[artistGenre]) {
              genreCount[artistGenre]++;
            } else {
              genreCount[artistGenre] = 1;
            }
          }
        }
      }
    }
  }

  var artistArray = [];
  for (var artist in artistCount) {
    artistArray.push([artist, artistCount[artist]]);
  }
  
  artistArray.sort(function(a, b) {
    return b[1] - a[1];
  });
  
  var topArtists = artistArray.slice(0, 10);

  var genreArray = [];
  for (var genre in genreCount) {
    genreArray.push([genre, genreCount[genre]]);
  }
  
  genreArray.sort(function(a, b) {
    return b[1] - a[1];
  });
  
  if (genreArray.length > 7) {
    var topGenres = genreArray.slice(0, 6);
    var otherGenres = genreArray.slice(6);
    
    var otherCount = 0;
    for (var n = 0; n < otherGenres.length; n++) {
      otherCount += otherGenres[n][1];
    }
    
    if (otherCount > 0) {
      topGenres.push(['Autres', otherCount]);
    }
    
    genreArray = topGenres;
  }

  renderArtistsChart(topArtists);
  renderGenresChart(genreArray);
}

function renderArtistsChart(data) {
  var ctx = document.getElementById('artistsChart').getContext('2d');
  
  var labels = [];
  var values = [];
  for (var i = 0; i < data.length; i++) {
    labels.push(data[i][0]);
    values.push(data[i][1]);
  }
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Nombre de morceaux',
        data: values,
        backgroundColor: '#64B5F6',
        borderColor: '#1E88E5',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Top 10 des artistes (nombre de morceaux)',
          font: { size: 16 }
        },
        legend: { display: false }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function renderGenresChart(data) {
  var ctx = document.getElementById('genresChart').getContext('2d');
  
  var colors = [
    '#FF9AA2',
    '#74B9FF',
    '#FFD700',
    '#55EDBF',
    '#B19CD9',
    '#FF9966',
    '#A3D39C',
    '#CCCCCC',
  ];
  
  var labels = [];
  var values = [];
  for (var i = 0; i < data.length; i++) {
    labels.push(data[i][0]);
    values.push(data[i][1]);
  }
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, data.length),
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Distribution des genres musicaux',
          font: { size: 16 }
        },
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              var label = context.label || '';
              var value = context.raw || 0;
              
              var total = 0;
              for (var i = 0; i < context.dataset.data.length; i++) {
                total += context.dataset.data[i];
              }
              
              var percentage = Math.round((value / total) * 100);
              return label + ': ' + value + ' (' + percentage + '%)';
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function populateSongsTable(tracks) {
  var tbody = document.getElementById('songsTableBody');
  tbody.innerHTML = '';

  for (var i = 0; i < tracks.length; i++) {
    var track = tracks[i];
    
    var row = document.createElement('tr');
    
    var nameCell = document.createElement('td');
    nameCell.textContent = track.name;
    row.appendChild(nameCell);
    
    var artistCell = document.createElement('td');
    var artistNames = [];
    for (var j = 0; j < track.artists.length; j++) {
      artistNames.push(track.artists[j].name);
    }
    artistCell.textContent = artistNames.join(', ');
    row.appendChild(artistCell);
    
    var albumCell = document.createElement('td');
    albumCell.textContent = track.album ? track.album.name : '';
    row.appendChild(albumCell);
    
    var actionCell = document.createElement('td');
    actionCell.className = 'text-center';
    
    var detailButton = document.createElement('button');
    detailButton.className = 'btn btn-sm btn-outline-primary details-btn';
    detailButton.setAttribute('data-bs-toggle', 'modal');
    detailButton.setAttribute('data-bs-target', '#songDetailModal');
    detailButton.setAttribute('data-song-id', track.id);
    
    var icon = document.createElement('i');
    icon.className = 'bi bi-info-circle';
    detailButton.appendChild(icon);
    
    var buttonText = document.createTextNode(' Détails');
    detailButton.appendChild(buttonText);
    actionCell.appendChild(detailButton);
    row.appendChild(actionCell);
    
    tbody.appendChild(row);
  }
}

function setupModalListener(tracks) {
  var songDetailModal = document.getElementById('songDetailModal');
  
  songDetailModal.addEventListener('show.bs.modal', function (event) {
    var button = event.relatedTarget;
    var songId = button.getAttribute('data-song-id');
    
    var track = null;
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].id === songId) {
        track = tracks[i];
        break;
      }
    }
    
    if (track) {
      document.getElementById('modalSongTitle').textContent = track.name;
      document.getElementById('modalSongDuration').textContent = formatDuration(track.duration_ms);
      document.getElementById('modalSongPopularity').textContent = track.popularity || 0;
      document.getElementById('modalTrackNumber').textContent = track.track_number || 1;
      document.getElementById('modalExplicit').textContent = track.explicit ? 'Oui' : 'Non';
      
      if (track.album) {
        var albumImage = '';
        if (track.album.images && track.album.images.length > 0) {
          albumImage = track.album.images[0].url;
        }
        document.getElementById('modalAlbumImage').src = albumImage;
        document.getElementById('modalReleaseDate').textContent = formatDate(track.album.release_date);
        document.getElementById('modalAlbumPopularity').textContent = 'Popularité: ' + (track.album.popularity || 0) + '/100';
      }
      
      var audioElement = document.getElementById('modalAudioPreview');
      if (track.preview_url) {
        audioElement.src = track.preview_url;
        audioElement.style.display = 'block';
      } else {
        audioElement.style.display = 'none';
      }
      
      var artistsListElement = document.getElementById('modalArtistsList');
      artistsListElement.innerHTML = '<strong>Artistes :</strong>';
      
      var artistsList = document.createElement('ul');
      artistsList.className = 'list-unstyled mt-1';
      
      for (var j = 0; j < track.artists.length; j++) {
        var artist = track.artists[j];
        
        var artistItem = document.createElement('li');
        artistItem.className = 'd-flex align-items-center mb-2';
        
        var artistImageUrl = 'https://via.placeholder.com/30';
        if (artist.images && artist.images.length > 0) {
          artistImageUrl = artist.images[0].url;
        }
        
        var artistImg = document.createElement('img');
        artistImg.src = artistImageUrl;
        artistImg.className = 'rounded-circle me-2';
        artistImg.width = 30;
        artistImg.height = 30;
        artistImg.onerror = function() { 
          this.src = 'https://via.placeholder.com/30'; 
        };
        artistItem.appendChild(artistImg);
        
        var artistInfo = document.createElement('div');
        
        var artistName = document.createElement('div');
        artistName.textContent = artist.name;
        artistInfo.appendChild(artistName);
        
        var artistStats = document.createElement('small');
        artistStats.className = 'text-muted';
        artistStats.textContent = 'Popularité: ' + (artist.popularity || 0) + '/100';
        
        if (artist.followers && artist.followers.total) {
          artistStats.textContent += ' • ' + artist.followers.total + ' followers';
        }
        
        artistInfo.appendChild(artistStats);
        artistItem.appendChild(artistInfo);
        
        artistsList.appendChild(artistItem);
      }
      
      artistsListElement.appendChild(artistsList);
      
      var genresElement = document.getElementById('modalGenres');
      genresElement.innerHTML = '';
      
      var genres = [];
      if (track.album && track.album.genres) {
        genres = track.album.genres;
      }
      
      if (genres.length > 0) {
        for (var k = 0; k < genres.length; k++) {
          var genre = genres[k];
          
          var badge = document.createElement('span');
          badge.className = 'badge bg-secondary me-1 mb-1';
          badge.textContent = genre;
          genresElement.appendChild(badge);
        }
      } else {
        genresElement.textContent = 'Aucun genre disponible';
      }
      
      var spotifyLink = document.getElementById('modalSpotifyLink');
      if (track.external_urls && track.external_urls.spotify) {
        spotifyLink.href = track.external_urls.spotify;
        spotifyLink.style.display = 'inline-block';
      } else {
        spotifyLink.style.display = 'none';
      }
    }
  });
}

function AlbumPopulaire(tracks) {
  var albums = {};
  
  for (var i = 0; i < tracks.length; i++) {
    var track = tracks[i];
    
    if (track.album && track.album.id) {
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
      
      for (var j = 0; j < track.artists.length; j++) {
        var artistName = track.artists[j].name;
        if (!albums[track.album.id].artistNames.includes(artistName)) {
          albums[track.album.id].artistNames.push(artistName);
        }
      }
    }
  }
  
  var albumsList = [];
  for (var id in albums) {
    albumsList.push(albums[id]);
  }
  
  albumsList.sort(function(a, b) {
    return b.popularity - a.popularity;
  });
  
  var topAlbums = albumsList.slice(0, 12);
  
  var container = document.getElementById('popularAlbums');
  container.innerHTML = '';
  
  for (var i = 0; i < topAlbums.length; i++) {
    var album = topAlbums[i];
    
    var col = document.createElement('div');
    col.className = 'col';
    
    var card = document.createElement('div');
    card.className = 'card h-100 shadow-sm';
    
    var img = document.createElement('img');
    img.className = 'card-img-top';
    img.style.height = '200px';
    img.style.objectFit = 'cover';
    
    if (album.images && album.images.length > 0) {
      img.src = album.images[0].url;
    } else {
      img.src = 'https://via.placeholder.com/300';
    }
    card.appendChild(img);
    
    var cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    var title = document.createElement('h5');
    title.className = 'card-title text-truncate';
    title.textContent = album.name;
    cardBody.appendChild(title);
    
    var artist = document.createElement('p');
    artist.className = 'card-text text-truncate';
    artist.textContent = album.artistNames[0] || '';
    cardBody.appendChild(artist);
    
    var dateP = document.createElement('p');
    dateP.className = 'card-text';
    var dateSmall = document.createElement('small');
    dateSmall.className = 'text-muted';
    
    if (album.release_date) {
      var date = new Date(album.release_date);
      var day = date.getDate();
      var month = date.toLocaleString('fr-FR', { month: 'long' });
      var year = date.getFullYear();
      dateSmall.textContent = day + ' ' + month + ' ' + year;
    }
    
    dateP.appendChild(dateSmall);
    cardBody.appendChild(dateP);
    
    var badges = document.createElement('div');
    badges.className = 'd-flex justify-content-between align-items-center';
    
    var trackBadge = document.createElement('span');
    trackBadge.className = 'badge bg-primary';
    trackBadge.textContent = album.trackCount + ' titres';
    badges.appendChild(trackBadge);
    
    var popBadge = document.createElement('span');
    popBadge.className = 'badge bg-success';
    popBadge.textContent = album.popularity + '/100';
    badges.appendChild(popBadge);
    
    cardBody.appendChild(badges);
    card.appendChild(cardBody);
    col.appendChild(card);
    
    container.appendChild(col);
  }
}

function formatDuration(ms) {
  if (!ms) return '0:00';
  
  var minutes = Math.floor(ms / 60000);
  var seconds = Math.floor((ms % 60000) / 1000);
  
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  
  return minutes + ':' + seconds;
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  var date = new Date(dateString);
  
  var day = date.getDate();
  var month = date.toLocaleString('fr-FR', { month: 'long' });
  var year = date.getFullYear();
  
  return day + ' ' + month + ' ' + year;
}

function setupSearch() {
  var searchInput = document.getElementById('searchInput');
  
  searchInput.addEventListener('input', function () {
    var term = this.value.toLowerCase();
    var rows = document.querySelectorAll('#songsTableBody tr');
    
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var cells = row.cells;
      
      var title = cells[0].textContent.toLowerCase();
      var artist = cells[1].textContent.toLowerCase();
      var album = cells[2].textContent.toLowerCase();
      
      if (title.includes(term) || artist.includes(term) || album.includes(term)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
}

function setupSorting() {
  var headers = document.querySelectorAll('.sortable');
  
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    header.style.cursor = 'pointer';
    
    header.addEventListener('click', function () {
      var sortKey = this.dataset.sort;
      var colIndex = 0;
      
      var headerParent = this.parentNode;
      for (var j = 0; j < headerParent.children.length; j++) {
        if (headerParent.children[j] === this) {
          colIndex = j;
          break;
        }
      }
      
      var direction = 'asc';
      if (this.dataset.sortDir === 'asc') {
        direction = 'desc';
      }
      this.dataset.sortDir = direction;
      
      var tbody = document.getElementById('songsTableBody');
      var rows = [];
      for (var k = 0; k < tbody.rows.length; k++) {
        rows.push(tbody.rows[k]);
      }
      
      rows.sort(function(a, b) {
        var cellA = a.cells[colIndex].textContent.toLowerCase();
        var cellB = b.cells[colIndex].textContent.toLowerCase();
        
        if (direction === 'asc') {
          return cellA.localeCompare(cellB);
        } else {
          return cellB.localeCompare(cellA);
        }
      });
      
      for (var l = 0; l < rows.length; l++) {
        tbody.appendChild(rows[l]);
      }
      
      for (var m = 0; m < headers.length; m++) {
        var el = headers[m];
        el.classList.remove('text-primary');
        
        var icon = el.querySelector('i');
        if (icon) {
          icon.remove();
        }
      }
      
      this.classList.add('text-primary');
      
      var icon = document.createElement('i');
      if (direction === 'asc') {
        icon.className = 'bi bi-sort-alpha-down ms-1';
      } else {
        icon.className = 'bi bi-sort-alpha-up ms-1';
      }
      this.appendChild(icon);
    });
  }
}
