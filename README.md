# DevBoard Backend

## Getting Started

### Prerequisites

- Node.js
- NPM

### Installation

1. Clone the repo

```bash
git clone https://github.com/devboardorg/devboard-backend.git
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory and add the following variables

```bash
BACKEND_HOST_URL="http://localhost:8000"
CLOUDINARY_API_SECRET="add you own secret"
CLOUDINARY_API_KEY="add you own key"
CLOUDINARY_COLUD_NAME="add you own cloudinary name"
REFRESH_TOKEN_EXPIRY="10d"
REFRESH_TOKEN_SECRET="generate your self"
ACCESS_TOKEN_EXPIRY="1d"
ACCESS_TOKEN_SECRET="generate your self"
PORT="8000"
MONGODB_URI="use your own mongodb uri"
DATABASE_PASSWORD="your own password"
DATABASE_USERNAME="databse username"
```

4. Run the server

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:8000`

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with clear and descriptive commit messages
4. Push your changes to your forked repository
5. Create a pull request to the main repository

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
