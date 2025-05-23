# Contributing to DiscordFeed

Thank you for your interest in contributing to DiscordFeed! We welcome all kinds of contributions, including bug reports, feature requests, documentation improvements, and code.

## Code of Conduct

Please be respectful and considerate in all interactions. By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md) (if present).

## How to Contribute

### 1. Fork the Repository

Click the "Fork" button at the top right of the [repository page](https://github.com/simplysylvias/discordfeed) to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/simplysylvia/discordfeed.git
cd discordfeed
```

### 3. Create a Feature Branch

Name your branch descriptively:

```bash
git checkout -b feature/amazing-feature
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Make Your Changes

- Follow the project structure and code style.
- Add or update tests as appropriate.
- Run tests locally before submitting:

  ```bash
  npm run test
  npm run test:e2e
  ```

### 6. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git commit -m "Add amazing feature"
```

### 7. Push to Your Fork

```bash
git push origin feature/amazing-feature
```

### 8. Open a Pull Request

- Go to the original repository and click "New Pull Request".
- Select your branch and describe your changes.
- Reference any related issues.

## Development Guidelines

- **Code Style:** Use Prettier and ESLint (`npm run lint`).
- **Testing:** All new features and bug fixes should include tests.
- **Documentation:** Update documentation as needed.
- **Environment:** See [docs/environment-setup.md](./docs/environment-setup.md) for setup instructions.

## Reporting Issues

If you find a bug or have a feature request, please [open an issue](https://github.com/simplysylvia/discordfeed/issues) and provide as much detail as possible.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
