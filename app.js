const genreInput = document.getElementById('genreInput');
const authorInput = document.getElementById('authorInput');
const languageInput = document.getElementById('languageInput');
const yearFromInput = document.getElementById('yearFromInput');
const yearToInput = document.getElementById('yearToInput');
const amountInput = document.getElementById('amountInput');
const fetchButton = document.getElementById('fetchButton');
const bookDisplay = document.getElementById('bookDisplay');
const favoritesList = document.getElementById('favoritesList');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isFavorite(bookKey) {
  return favorites.some(fav => fav.key === bookKey);
}

function toggleFavorite(book) {
  const index = favorites.findIndex(fav => fav.key === book.key);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(book);
  }
  saveFavorites();
  displayBooks(currentBooks);
  displayFavorites();
}

function createBookCard(book) {
    const div = document.createElement('div');
    div.className = 'bg-white rounded shadow p-4 flex flex-col justify-between';
  
    const title = book.title || 'No title';
    const author = book.author_name?.join(', ') || 'Unknown author';
    const year = book.first_publish_year || 'Unknown year';
  
    const coverId = book.cover_i;
    const coverUrl = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : 'https://via.placeholder.com/128x193?text=No+Cover';
  
    // Set the card content including the cover image
    div.innerHTML = `
      <img src="${coverUrl}" alt="${title}" class="w-full h-48 object-cover mb-2 rounded">
      <h3 class="font-bold text-lg">${title}</h3>
      <p class="text-sm text-gray-600">By: ${author}</p>
      <p class="text-sm text-gray-600">Published: ${year}</p>
      <div class="mt-4 flex justify-between items-center">
        <button class="details-btn text-blue-600 underline">More Info</button>
        <button class="fav-btn px-2 py-1 rounded text-white ${isFavorite(book.key) ? 'bg-red-500' : 'bg-green-600'}">
          ${isFavorite(book.key) ? 'Remove from Favorites' : 'Add to Favorites'}
        </button>
      </div>
    `;
  
    // Add event listeners for the buttons
    div.querySelector('.fav-btn').addEventListener('click', () => toggleFavorite(book));
    div.querySelector('.details-btn').addEventListener('click', () => showDetails(book));
  
    return div;
}

function displayBooks(books) {
  bookDisplay.innerHTML = '';
  books.forEach(book => bookDisplay.appendChild(createBookCard(book)));
}

function displayFavorites() {
  favoritesList.innerHTML = '';
  favorites.forEach(book => favoritesList.appendChild(createBookCard(book)));
}

let currentBooks = [];

async function fetchBooks() {
  const genre = genreInput.value;
  const author = authorInput.value;
  const language = languageInput.value;
  const yearFrom = isNaN(parseInt(yearFromInput.value)) ? null : parseInt(yearFromInput.value);
  const yearTo = isNaN(parseInt(yearToInput.value)) ? null : parseInt(yearToInput.value);
  const amount = parseInt(amountInput.value);

  let url = `https://openlibrary.org/search.json?`;
  if (genre) url += `subject=${genre}&`;
  if (author) url += `author=${encodeURIComponent(author)}&`;
  if (language) url += `language=${language}&`;
  url += `limit=50`;
  console.log(`Fetching URL: ${url}`);

  const response = await fetch(url);
  const data = await response.json();

  const filtered = data.docs.filter(book => {
    const pubYear = book.first_publish_year;
    if (yearFrom && pubYear < yearFrom) return false;
    if (yearTo && pubYear > yearTo) return false;
    return true;
  });

  // Shuffle and pick amount
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  currentBooks = shuffled.slice(0, amount);
  displayBooks(currentBooks);
}

async function showDetails(book) {
    try {
      const workKey = book.key; // e.g., "/works/OL12345W"
      const res = await fetch(`https://openlibrary.org${workKey}.json`);
      const details = await res.json();
  
      const title = details.title || book.title;
      const description = typeof details.description === 'string' ? details.description : details.description?.value || 'No description available';
      const authors = details.authors?.map(author => author.name).join(', ') || 'Unknown authors';
      const firstPublishDate = details.first_publish_date || 'Unknown year';
      const subjects = details.subjects?.join(', ') || 'No subjects available';
      const publishers = details.publishers?.join(', ') || 'Unknown publisher(s)';
      const coverId = details.cover_id;
      const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : 'https://via.placeholder.com/300x450?text=No+Cover';
  
      // Building a richer modal content with only relevant information
      modalContent.innerHTML = `
        <div class="modal-header flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">${title}</h2>
        </div>
        <div class="modal-body flex">
          <img src="${coverUrl}" alt="${title}" class="w-40 h-auto rounded-lg mr-6">
          <div class="details">
            <p><strong>Description:</strong><br> ${description}</p>
            ${authors !== 'Unknown authors' ? `<p><strong>Authors:</strong> ${authors}</p>` : ''}
            ${firstPublishDate !== 'Unknown year' ? `<p><strong>First Published:</strong> ${firstPublishDate}</p>` : ''}
            ${subjects !== 'No subjects available' ? `<p><strong>Subjects:</strong> ${subjects}</p>` : ''}
            ${publishers !== 'Unknown publisher(s)' ? `<p><strong>Publisher(s):</strong> ${publishers}</p>` : ''}
          </div>
        </div>
      `;
  
      modal.classList.remove('hidden');
    } catch (error) {
      console.error('Error loading details:', error);
      modalContent.innerHTML = `<p class="text-red-500">Error loading details.</p>`;
      modal.classList.remove('hidden');
    }
  }


closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
});

fetchButton.addEventListener('click', fetchBooks);

displayFavorites();
