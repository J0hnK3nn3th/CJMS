# CJMS Frontend

This is the React.js frontend for the Criminal Justice Management System (CJMS).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.js       # Navigation header
│   ├── Footer.js       # Footer component
│   └── Home.js         # Home page component
├── services/           # API services
│   └── api.js          # Axios configuration and API calls
├── utils/              # Utility functions
│   └── helpers.js      # Helper functions
├── App.js              # Main App component
├── App.css             # App styles
├── index.js            # Entry point
└── index.css           # Global styles
```

## API Integration

The frontend connects to the Django backend through the API service located in `src/services/api.js`. The API base URL is configured to point to `http://localhost:8000/api` by default.

### Environment Variables

You can customize the API URL by creating a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).