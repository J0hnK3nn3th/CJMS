# CJMS - Criminal Justice Management System

A full-stack web application built with Django REST Framework backend and React.js frontend for managing criminal justice cases and related data.

## Project Structure

```
CJMS/
├── backend/                 # Django backend
│   ├── api/                # Django REST API app
│   │   ├── models.py       # Database models
│   │   ├── serializers.py  # API serializers
│   │   ├── views.py        # API views
│   │   └── urls.py         # API URL patterns
│   ├── settings.py         # Django settings
│   ├── urls.py             # Main URL configuration
│   └── ...
├── frontend/               # React.js frontend
│   ├── public/             # Static files
│   ├── src/                # React source code
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   └── package.json        # Node.js dependencies
└── requirements.txt        # Python dependencies
```

## Features

- **Case Management**: Create, read, update, and delete cases
- **User Authentication**: Secure login and registration
- **File Uploads**: Attach files to cases
- **Notes System**: Add notes to cases
- **Dashboard**: Overview of case statistics
- **Responsive Design**: Mobile-friendly interface

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the project root directory:
   ```bash
   cd CJMS
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   ```bash
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run database migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

7. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login and get token
- `POST /api/auth/logout/` - Logout

### Cases
- `GET /api/cases/` - List all cases
- `POST /api/cases/` - Create new case
- `GET /api/cases/{id}/` - Get specific case
- `PUT /api/cases/{id}/` - Update case
- `DELETE /api/cases/{id}/` - Delete case
- `POST /api/cases/{id}/add_note/` - Add note to case
- `POST /api/cases/{id}/upload_file/` - Upload file to case

### Users
- `GET /api/users/` - List users
- `GET /api/users/{id}/` - Get user details

## Development

### Backend Development

The Django backend uses:
- Django REST Framework for API development
- Django CORS Headers for cross-origin requests
- Token authentication for API security

### Frontend Development

The React frontend uses:
- React Router for navigation
- Axios for API calls
- CSS modules for styling
- Modern React hooks (useState, useEffect)

## Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@cjms.com or create an issue in the repository.

