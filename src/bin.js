#!/usr/bin/env node

// @flow

import { join } from 'path';
import { readdir } from 'fs';
import { readJSON } from 'fs-extra';
import web from './web';

const puppeteer = require('puppeteer');

const backupPath =
  '/Users/charliejackson/Downloads/Export - All Entries (2018-12-03)';
const journalJSONPath = join(backupPath, 'Journal.json');
const photosPath = join(backupPath, 'photos');
const outPath = join(__dirname, '../journal-images/');

/**
 * Get the date string
 */
const getDateString = (date) => {
  const day = `0${date.getDate()}`.slice(-2);
  const month = `0${date.getMonth() + 1}`.slice(-2);

  const dateString = `${date.getFullYear()}-${month}-${day}`;

  return dateString;
};

/**
 * Get the path to save the screenshot
 */
const getScreenshotPath = (date) => {
  const path = join(outPath, `journal-${getDateString(date)}.png`);

  return path;
};

/**
 * Process the text
 */
const processText = (text) => {
  let newText = text;

  const replacements = [[/!\[\]\(dayone-moment:\/\/.*\)/]];

  newText = replacements.reduce(
    (accumulator, [regex, modifiers, replacement]) =>
      accumulator.replace(
        new RegExp(regex, modifiers || 'gm'),
        replacement || ''
      ),
    newText
  );

  let nextText = null;

  newText = newText.trim();

  if (!newText || newText === '') return '';

  while (!nextText || newText !== nextText) {
    if (!nextText) nextText = newText;

    newText = nextText;

    if (!newText || newText === '') return '';

    nextText = nextText.replace(new RegExp(/\n\n\n/, 'gm'), '\n\n');
    nextText = nextText.trim();
  }

  newText = newText.trim();

  return newText;
};

/**
 * Process an individual entry
 */
const processEntry = (
  page,
  {
    text, location, photos, date, screenshotPath,
  }
) => {
  const processedText = processText(text);

  if (!processedText || !processedText.length) return Promise.resolve();

  return web(page, {
    screenshotPath,
    text: processedText,
    location: location && location.placeName,
    photos:
      photos &&
      photos.map(({ md5, type }) => join(photosPath, `${md5}.${type}`)),
    date,
  });
};

/**
 * Process each entry
 */
const processEntries = (page, entries) =>
  new Promise((resolve, reject) =>
    readdir(outPath, (err, items) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(items.map(item => join(outPath, item)));
    })).then((items) => {
    const orderedEntries = entries.reverse();
    let processed = 0;

    /**
     * Loop through the entries
     */
    const loop = (i = 0) => {
      const entry = orderedEntries[i];

      if (processed > 3) {
        // eslint-disable-next-line
        console.log(
          'Processed 100 images and still have not finished. Run again.');
        return Promise.resolve();
      }

      if (!entry) return Promise.resolve();

      const date = new Date(entry.creationDate);
      const screenshotPath = getScreenshotPath(date);

      if (items.includes(screenshotPath)) return loop(i + 1);

      processed += 1;

      return processEntry(page, { date, screenshotPath, ...entry }).then(() =>
        loop(i + 1));
    };

    return loop();
  });

/**
 * Initialise the script
 */
const init = () =>
  new Promise((resolve, reject) =>
    readJSON(journalJSONPath, (e, data) =>
      (e ? reject(e) : resolve(data.entries)))).then(entries =>
    puppeteer.launch().then(browser =>
      browser
        .newPage()
        .then(page => processEntries(page, entries))
        .catch(e =>
          browser.close().then(() => {
            throw e;
          }))
        .then(() => browser.close())));

init();
