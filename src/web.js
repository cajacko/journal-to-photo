// @flow

import { join } from 'path';
import { writeFile, readFile, ensureFile } from 'fs-extra';

const Utimes = require('@ronomon/utimes');

const htmlPath = join(__dirname, 'index.html');
const htmlSrcPath = join(__dirname, 'htmlSrc.html');

/**
 * Set the index html file
 */
const setHtml = content =>
  new Promise((resolve, reject) => {
    readFile(htmlSrcPath, (e, data) => {
      if (e) return reject(e);

      const newContent = data
        .toString()
        .replace('TEMPLATE', JSON.stringify(content));

      return writeFile(htmlPath, newContent, (error) => {
        if (error) return reject(error);

        return resolve();
      });
    });
  });

/**
 * Take a screenshot
 */
const web = (page, entry) =>
  setHtml(entry).then(() =>
    page
      .goto(`file:///${htmlPath}`, {
        waitUntil: 'networkidle0',
      })
      .then(() => page.setViewport({ height: 3024, width: 4032 }))
      .then(() =>
        new Promise((resolve, reject) =>
          ensureFile(entry.screenshotPath, e => (e ? reject(e) : resolve()))))
      .then(() =>
        page.screenshot({
          path: entry.screenshotPath,
        }))
      .then(() =>
        new Promise((resolve, reject) => {
          const time = Math.round(entry.date.getTime());

          Utimes.utimes(entry.screenshotPath, time, time, time, (e) => {
            if (e) {
              reject(e);
              return;
            }

            resolve();
          });
        })));

export default web;
