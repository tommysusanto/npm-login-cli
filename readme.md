# npm-login-cli

A lean, dependency-free CLI tool that automates `npm login` for CI/CD pipelines by programmatically responding to interactive prompts.

## Why it exists

The standard `npm login` command requires interactive input, making it impossible to use in automated CI/CD pipelines. This tool spawns `npm login` and automatically responds to the username, password, and email prompts, enabling fully automated npm authentication.

## Installation

```bash
npm install -g npm-login-cli
```

## Usage

```bash
npm-login-cli <registry> <username> <password> <email> [timeout]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| registry | Yes | Registry URL (must be http:// or https://) |
| username | Yes | npm username |
| password | Yes | npm password |
| email | Yes | Email address (will be public on npm) |
| timeout | No | Kill process after N milliseconds (default: 5000) |

### Flags

| Flag | Description |
|------|-------------|
| `--help`, `-h` | Show usage information |

## Examples

### npm public registry

```bash
npm-login-cli https://registry.npmjs.org myuser mypassword user@example.com
```

### Verdaccio (local registry)

```bash
npm-login-cli http://localhost:4873 admin admin admin@localhost
```

### Artifactory

```bash
npm-login-cli https://mycompany.jfrog.io/artifactory/api/npm/npm-local/ myuser mytoken user@company.com
```

### GitHub Packages

```bash
npm-login-cli https://npm.pkg.github.com myuser $GITHUB_TOKEN user@example.com
```

### Custom timeout

```bash
npm-login-cli https://registry.npmjs.org myuser mypass user@example.com 10000
```

## CI/CD Examples

### GitHub Actions

```yaml
- name: Login to npm
  run: npm-login-cli https://registry.npmjs.org ${{ secrets.NPM_USER }} ${{ secrets.NPM_PASS }} ${{ secrets.NPM_EMAIL }}
```

### GitLab CI

```yaml
npm-login:
  script:
    - npm-login-cli https://registry.npmjs.org $NPM_USER $NPM_PASS $NPM_EMAIL
```

### Jenkins (Pipeline)

```groovy
withCredentials([
  string(credentialsId: 'npm-user', variable: 'NPM_USER'),
  string(credentialsId: 'npm-pass', variable: 'NPM_PASS'),
  string(credentialsId: 'npm-email', variable: 'NPM_EMAIL')
]) {
  sh 'npm-login-cli https://registry.npmjs.org $NPM_USER $NPM_PASS $NPM_EMAIL'
}
```

## Security Considerations

**Command-line arguments are visible in process listings.** Any user on the same system can see the password by running `ps aux`. In CI/CD environments, this is typically acceptable because:

1. Build agents are ephemeral and isolated
2. Other users don't have access to the build machine
3. Secrets are masked in CI logs

For local development, consider using `npm login` interactively instead.

**Always use environment variables or CI secrets** rather than hardcoding credentials in scripts.

## Troubleshooting

### Login hangs or times out

The tool expects specific prompt text from npm. If npm's prompts have changed, the tool may not respond correctly. Increase the timeout to allow more time:

```bash
npm-login-cli https://registry.npmjs.org user pass email 30000
```

### "Invalid registry URL" error

The registry must be a full URL with protocol:

```bash
# Wrong
npm-login-cli registry.npmjs.org user pass email

# Correct
npm-login-cli https://registry.npmjs.org user pass email
```

### Authentication still fails

Some registries require additional configuration (tokens, 2FA, OAuth). This tool only handles basic username/password authentication.

## Limitations

- **No 2FA support**: Cannot handle two-factor authentication prompts
- **No OAuth/SSO**: Only supports username/password authentication
- **Prompt-dependent**: Relies on exact prompt text from npm; may break if npm changes its prompts
- **Password visible**: Arguments are visible in process listings (use CI secrets)

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (missing arguments, invalid URL, npm login failed) |

## License

ISC
