// Export of the report on the screen as PDF / Excel / CSV: loads the pages that are still missing, builds the table
// model, asks the server for the file and opens its link (the phone's browser downloads it).
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { useDispatch, useStore } from 'react-redux';
import { createReportExport } from '../api/reportExportApi';
import { showToast } from '../store/slices/toastSlice';
import { MAX_EXPORT_ROWS, limitRows } from '../utils/reportExports';

const MAX_PAGES = 400; // a safety stop for the "load every page" loop
const MAX_WAITS = 20;
const WAIT_MS = 500;

/**
 * @param {object} options
 * @param {function} options.select (state) => parsed report data of this page
 * @param {function} [options.loadMore] (data) => thunk action that loads the next page (reports with pages only)
 * @param {function} options.build (data, subtitle) => export model, see utils/reportExports.js
 * @param {string} options.subtitle Vehicle and dates line
 * @returns {{ exportFile: function, busyFormat: string }} busyFormat is '' when nothing is being made
 */
export default function useReportExport({ select, loadMore, build, subtitle }) {
  const dispatch = useDispatch();
  const store = useStore();
  const [busyFormat, setBusyFormat] = useState('');

  const exportFile = useCallback(
    async (format) => {
      if (busyFormat) {
        return;
      }
      setBusyFormat(format);
      try {
        let data = select(store.getState());
        let pages = 0;
        let waits = 0;
        // The screen only holds the pages that were loaded; the file must have every row
        while (loadMore && data.page < data.lastPage && data.rows.length < MAX_EXPORT_ROWS && pages < MAX_PAGES) {
          const result = await dispatch(loadMore(data));
          if (result.meta.requestStatus === 'fulfilled') {
            data = select(store.getState());
            pages += 1;
          } else if (result.meta.condition && waits < MAX_WAITS) {
            // the screen is loading a page itself; wait for it and try again
            waits += 1;
            await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
            data = select(store.getState());
          } else {
            throw new Error('Could not load every row of the report. Check the internet and try again.');
          }
        }

        const model = limitRows(build(data, subtitle));
        const answer = await createReportExport(format, model);
        if (!answer || answer.status !== 1 || !answer.url) {
          throw new Error((answer && answer.message) || 'The file could not be made');
        }
        await Linking.openURL(answer.url);
        if (data.rows.length > MAX_EXPORT_ROWS) {
          dispatch(
            showToast({
              type: 'info',
              message: `The file has the first ${MAX_EXPORT_ROWS} rows. Use shorter dates for the rest.`,
            }),
          );
        }
      } catch (error) {
        dispatch(
          showToast({
            type: 'error',
            message: error.message || 'The file could not be made',
          }),
        );
      } finally {
        setBusyFormat('');
      }
    },
    [busyFormat, dispatch, store, select, loadMore, build, subtitle],
  );

  return { exportFile, busyFormat };
}
