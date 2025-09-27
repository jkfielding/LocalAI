# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of LocalAI Chat React seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via:
- **Email**: Send details to [security@yourdomain.com] (replace with actual email)
- **GitHub Security**: Use GitHub's private security reporting feature

### What to Include

Please include the following information in your report:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

We will:
- Confirm the problem and determine affected versions
- Audit code to find any similar problems
- Prepare fixes for the release
- Release new versions as soon as possible

## Security Considerations

### Local Network Security

This application is designed to run on local networks and includes the following security features:

- **No External Dependencies**: All AI processing happens locally
- **Local Network Only**: No external API calls or data transmission
- **No Authentication Required**: Designed for single-user local use
- **Data Privacy**: Chat history stored locally in Docker volumes

### Deployment Security

#### Docker Security
- Container runs as non-root user
- Minimal attack surface with Alpine Linux base
- No unnecessary services or ports exposed
- Health checks to monitor container status

#### Network Security
- Binds to localhost by default
- Network scanner only checks local network ranges
- No incoming connections from external networks
- CORS configured for local origins only

### Data Security

- **Local Storage**: All chat data stored in Docker volumes
- **No Cloud Sync**: No data transmitted to external servers
- **User Control**: Users have full control over their data
- **Easy Cleanup**: Complete data removal via `docker compose down -v`

## Best Practices for Users

### Secure Deployment
1. **Firewall**: Ensure your firewall blocks external access to port 5174
2. **Network**: Use on trusted networks only
3. **Updates**: Keep Docker and the application updated
4. **Monitoring**: Review Docker logs for unusual activity

### Data Protection
1. **Backup**: Export important conversations before updates
2. **Access Control**: Limit physical access to the host machine
3. **Network Isolation**: Consider network segmentation for sensitive use

## Known Limitations

- **No User Authentication**: Designed for single-user local use
- **Network Exposure**: Accessible to all devices on local network
- **No Encryption**: Communication over HTTP (suitable for local networks)

## Updates and Patches

Security updates will be released as:
- Patch versions (1.0.x) for minor security fixes
- Minor versions (1.x.0) for significant security improvements
- Docker images will be updated with security patches

Subscribe to releases to be notified of security updates.

## Contact

For security concerns or questions about this policy:
- Create a private security report on GitHub
- Email: [security@yourdomain.com] (replace with actual email)

Thank you for helping keep LocalAI Chat React secure!