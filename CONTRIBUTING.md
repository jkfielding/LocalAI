# Contributing to LocalAI Chat React

Thank you for your interest in contributing to LocalAI Chat React! 🎉

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- Docker Desktop (for containerized development)
- Git

### Development Setup
```bash
# Clone the repository
git clone https://github.com/jkfielding/LocalAI.git
cd LocalAI

# Install dependencies
npm install

# Start development server
npm run dev

# Or run with Docker
./quick-start.sh
```

## 🛠️ Development Workflow

### 1. Code Structure
```
src/
├── components/     # React components
├── contexts/       # React contexts
├── hooks/          # Custom hooks  
├── services/       # API services
├── types/          # TypeScript types
├── utils/          # Utility functions
└── assets/         # Static assets
```

### 2. Making Changes
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**: Ensure all functionality works
5. **Commit changes**: Use clear, descriptive commit messages
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Create Pull Request**

### 3. Code Standards
- **TypeScript**: All new code should be properly typed
- **ESLint**: Follow the project's linting rules
- **Components**: Use functional components with hooks
- **Styling**: Use Tailwind CSS classes
- **Documentation**: Add JSDoc comments for complex functions

### 4. Testing
```bash
# Lint code
npm run lint

# Type checking
npx tsc --noEmit

# Build project
npm run build

# Test Docker build
docker build -t localai-chat-test .
```

## 📝 Pull Request Guidelines

### Before Submitting
- [ ] Code follows the project style guidelines
- [ ] Self-review of code has been performed
- [ ] Changes have been tested on multiple browsers
- [ ] Docker build completes successfully
- [ ] Documentation is updated (if applicable)

### PR Description Should Include
- **Purpose**: What does this PR accomplish?
- **Changes**: List of key changes made
- **Testing**: How was this tested?
- **Screenshots**: For UI changes (if applicable)
- **Breaking Changes**: Any breaking changes (if applicable)

## 🐛 Bug Reports

### Before Reporting
1. **Search existing issues** to avoid duplicates
2. **Test with latest version**
3. **Test in Docker environment**

### Bug Report Should Include
- **Environment**: OS, browser, Docker version
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Console logs** (if applicable)

## 💡 Feature Requests

We welcome feature requests! Please:
1. **Check existing issues** for similar requests
2. **Describe the problem** you're trying to solve
3. **Propose a solution** (if you have one)
4. **Consider alternatives** you've considered

## 🎨 UI/UX Contributions

For design contributions:
- Follow the existing design system
- Ensure accessibility standards
- Test on multiple screen sizes
- Consider dark/light mode compatibility

## 🔧 Technical Areas We Need Help With

- **AI Service Integrations**: Support for new AI services
- **Mobile Optimization**: PWA enhancements
- **Performance**: Optimization and caching
- **Accessibility**: A11y improvements
- **Testing**: Unit and integration tests
- **Documentation**: Guides and examples

## 🏷️ Commit Message Convention

Use clear, descriptive commit messages:
```
feat: add network scanner progress indicators
fix: resolve setup wizard layout cutoff issue
docs: update Docker setup instructions
style: improve responsive design for mobile
refactor: optimize network scanning algorithm
```

## 📜 Code of Conduct

- **Be respectful** and inclusive
- **Provide constructive feedback**
- **Focus on the code**, not the person
- **Help newcomers** get started
- **Celebrate contributions** of all sizes

## 🆘 Getting Help

- **Issues**: Create an issue for bugs or questions
- **Discussions**: Use GitHub Discussions for general questions
- **Documentation**: Check README.md and docs/ folder

## 🙏 Recognition

Contributors will be:
- **Listed in README.md** contributors section
- **Mentioned in release notes** for significant contributions
- **Given credit** in commit messages and PRs

Thank you for contributing to LocalAI Chat React! 🚀