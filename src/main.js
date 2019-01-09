// @flow

const textLength = 175;

const themes = [
  'red',
  'pink',
  'deep-purple',
  'blue',
  'cyan',
  'teal',
  'green',
  'amber',
  'deep-orange',
  'blue-gray',
];

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Get the ordinal value
 */
const ordinal = (i) => {
  const j = i % 10;
  const k = i % 100;

  if (j === 1 && k !== 11) {
    return `${i}st`;
  }
  if (j === 2 && k !== 12) {
    return `${i}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${i}rd`;
  }
  return `${i}th`;
};

/**
 * Truncate text
 */
const truncate = (text, length) =>
  (text.length > length ? `${text.substring(0, length)}...` : text);

/**
 * Get a random number from 1-10 based off the entry
 */
const getRand = (date, text) => {
  const time = Math.round(new Date(date).getTime() / 1000);

  const timeString = String(time).split('');
  const textLengthString = String(text ? text.length : 0).split('');
  const lastTextLengthVal = parseInt(
    textLengthString[textLengthString.length - 1],
    10
  );
  const lastDateVal = parseInt(timeString[timeString.length - 1], 10);
  const randString = String(lastTextLengthVal + lastDateVal).split('');
  return parseInt(randString[randString.length - 1], 10);
};

/**
 * Set the main text
 */
const setText = (text) => {
  const textElement = document.getElementById('text');
  // TODO: Slit the text and shrink parts, so can look closer to get more detail
  textElement.innerHTML = truncate(text, textLength);
};

/**
 * Set the date text
 */
const setDate = (date) => {
  const d = new Date(date);

  document.getElementById('date').innerHTML = `${days[d.getDay()]}, ${ordinal(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Set the location text
 */
const setLocation = (location) => {
  if (location) {
    document.getElementById('location').innerHTML = truncate(location, 50);
  }
};

/**
 * Set the journal photos
 */
const setPhotos = (entry) => {
  const photosElement = document.getElementById('photos');

  if (!entry.photos || !entry.photos.length) {
    if (photosElement) {
      photosElement.remove();
    }

    return;
  }

  photosElement.innerHTML = '';

  const photos = entry.photos.slice(0, 4);

  document.getElementById('text').setAttribute('style', 'font-size: 0.8rem;');

  const mainElement = document.getElementById('main');
  const photosLength = photos.length;

  if (photosLength === 1) {
    mainElement.setAttribute('class', 'main photos-single');
  } else if (photosLength < 4) {
    mainElement.setAttribute('class', 'main photos-right');
  } else {
    mainElement.setAttribute('class', 'main photos-bottom');
  }

  photos.forEach((photo) => {
    const photoNode = document.createElement('div');
    photoNode.setAttribute('style', `background-image: url('${photo}');`);
    photoNode.setAttribute('class', 'photo');
    photosElement.appendChild(photoNode);

    const imageNode = document.createElement('img');
    imageNode.setAttribute('style', 'display: none;');
    imageNode.setAttribute('src', photo);
    imageNode.setAttribute('onerror', `window.imageError("${photo}")`);
    photosElement.appendChild(imageNode);
  });
};

/**
 * Set the theme
 */
const setTheme = (date, text) => {
  const theme = themes[getRand(date, text)];

  document.getElementById('body').setAttribute('class', `body body-${theme}`);
};

/**
 * Set the tag icons/images
 */
const setTags = (tags) => {
  if (!tags || tags.length === 0) return;

  const tagsElement = document.getElementById('tags');

  Object.keys(tags)
    .slice(0, 4)
    .forEach((tag) => {
      const val = tags[tag];
      const tagElement = document.createElement('div');
      tagElement.setAttribute('class', 'tag');

      tagElement.innerHTML = `<i class="fas fa-${val}"></i>`;
      tagsElement.appendChild(tagElement);
    });
};

/**
 * Initialise the app
 */
const init = () => {
  const {
    text, date, location, tags, ...entry
  } = window.entry;
  setTheme(date, text);
  setTags(tags);
  setText(text);
  setDate(date);
  setLocation(location);
  setPhotos(entry);
};

document.addEventListener('DOMContentLoaded', () => {
  init();
});

window.imageError = (src) => {
  window.entry.photos = window.entry.photos.filter(photo => photo !== src);
  init();
};
