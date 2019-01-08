// @flow

const textLength = 175;

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

const truncate = (text, length) =>
  (text.length > length ? `${text.substring(0, length)}...` : text);

document.addEventListener('DOMContentLoaded', () => {
  const {
    text, date, location, ...entry
  } = window.entry;

  const textElement = document.getElementById('text');
  // TODO: Slit the text and shrink parts, so can look closer to get more detail
  textElement.innerHTML = truncate(text, textLength);

  const d = new Date(date);

  document.getElementById('date').innerHTML = `${days[d.getDay()]}, ${ordinal(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;

  if (location) {
    document.getElementById('location').innerHTML = truncate(location, 50);
  }

  if (!entry.photos || !entry.photos.length) {
    document.getElementById('photos').remove();
    return;
  }

  const photos = entry.photos.slice(0, 4);

  textElement.setAttribute('style', 'font-size: 0.8rem;');

  const photosElement = document.getElementById('photos');
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
  });
});
