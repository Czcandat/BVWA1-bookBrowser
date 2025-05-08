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
      : 'https://placecats.com/320/180';
  

    div.innerHTML = `
      <img src="${coverUrl}" alt="${title}" class="w-full h-48 object-contain mb-2 rounded bg-gray-100">

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

function showSkeletons(count = 3) {
  bookDisplay.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'bg-white rounded shadow p-4 flex flex-col justify-between animate-pulse';

    skeleton.innerHTML = `
      <div class="w-full h-48 bg-gray-300 rounded mb-2"></div>
      <div class="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div class="h-4 bg-gray-300 rounded w-1/2 mb-1"></div>
      <div class="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
      <div class="mt-auto flex justify-between items-center">
        <div class="h-4 w-20 bg-gray-300 rounded"></div>
        <div class="h-8 w-28 bg-gray-300 rounded"></div>
      </div>
    `;

    bookDisplay.appendChild(skeleton);
  }
}


async function fetchBooks() {
  const genre = genreInput.value;
  const author = authorInput.value;
  const language = languageInput.value;
  const yearFrom = isNaN(parseInt(yearFromInput.value)) ? null : parseInt(yearFromInput.value);
  const yearTo = isNaN(parseInt(yearToInput.value)) ? null : parseInt(yearToInput.value);
  const amount = parseInt(amountInput.value);
  showSkeletons(amount);

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
    try 
    {
      const workKey = book.key;
      const res = await fetch(`https://openlibrary.org${workKey}.json`);
      const details = await res.json();
  
      const title = details.title || book.title;
      const description = typeof details.description === 'string' ? details.description : details.description?.value || 'No description available';
      const authors = book.author_name?.join(', ') || 'Unknown author';
      const languages = book.language	?.join(', ') || 'Unknown languages';
      const firstPublishDate = book.first_publish_year || 'Unknown year';
      const subjects = details.subjects?.join(', ') || 'No subjects available';
      const coverId = book.cover_i;
      const coverUrl = coverId 
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : 'https://placecats.com/128/193';
  
      modalContent.innerHTML = 
        `<div class="p-6 bg-white rounded-lg shadow max-w-3xl w-full">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold text-gray-800">${title}</h2>
          </div>

          <div class="flex flex-col md:flex-row gap-6 overflow-y-auto max-h-[70vh]">
            <img src="${coverUrl}" alt="${title}" class="w-40 h-auto rounded-lg self-start flex-shrink-0">

            <div class="space-y-4 text-gray-700">
              <div>
                <h3 class="font-semibold mb-1">Description</h3>
                <p class="text-sm leading-relaxed">${description}</p>
              </div>
              ${authors !== 'Unknown author' ? `
              <div>
                <h3 class="font-semibold mb-1">Author(s)</h3>
                <p class="text-sm">${authors}</p>
              </div>` : ''}
              ${languages !== 'Unknown languages' ? `
                <div>
                  <h3 class="font-semibold mb-1">Language(s)</h3>
                  <p class="text-sm">${languages}</p>
                </div>` : ''}
              ${firstPublishDate !== 'Unknown year' ? `
              <div>
                <h3 class="font-semibold mb-1">First Published</h3>
                <p class="text-sm">${firstPublishDate}</p>
              </div>` : ''}
              ${subjects !== 'No subjects available' ? `
              <div>
                <h3 class="font-semibold mb-1">Tags</h3>
                <p class="text-sm">${subjects}</p>
              </div>` : ''}
            </div>
          </div>
        </div>
      `;

  
    modal.classList.remove('hidden');
  } 
  catch (error) 
  {
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
