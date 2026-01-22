const { test } = require('node:test')
const assert = require('node:assert')
const { spawn } = require('node:child_process')
const path = require('node:path')

const CLI_PATH = path.join(__dirname, '..', 'index.js')

function runCli(args = []) {
    return new Promise((resolve) => {
        const proc = spawn('node', [CLI_PATH, ...args])
        let stdout = ''
        let stderr = ''

        proc.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        proc.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        proc.on('close', (code) => {
            resolve({ code, stdout, stderr })
        })

        // Timeout after 3 seconds for tests that might hang
        setTimeout(() => {
            proc.kill()
            resolve({ code: null, stdout, stderr, killed: true })
        }, 3000)
    })
}

test('shows help with --help flag', async () => {
    const { code, stdout } = await runCli(['--help'])
    assert.strictEqual(code, 0)
    assert.ok(stdout.includes('npm-login-cli'))
    assert.ok(stdout.includes('Usage:'))
    assert.ok(stdout.includes('Arguments:'))
})

test('shows help with -h flag', async () => {
    const { code, stdout } = await runCli(['-h'])
    assert.strictEqual(code, 0)
    assert.ok(stdout.includes('npm-login-cli'))
    assert.ok(stdout.includes('Usage:'))
})

test('exits with error when no arguments provided', async () => {
    const { code, stderr } = await runCli([])
    assert.strictEqual(code, 1)
    assert.ok(stderr.includes('Error: Missing required arguments'))
})

test('exits with error when only 1 argument provided', async () => {
    const { code, stderr } = await runCli(['https://registry.npmjs.org'])
    assert.strictEqual(code, 1)
    assert.ok(stderr.includes('Error: Missing required arguments'))
})

test('exits with error when only 2 arguments provided', async () => {
    const { code, stderr } = await runCli(['https://registry.npmjs.org', 'user'])
    assert.strictEqual(code, 1)
    assert.ok(stderr.includes('Error: Missing required arguments'))
})

test('exits with error when only 3 arguments provided', async () => {
    const { code, stderr } = await runCli(['https://registry.npmjs.org', 'user', 'pass'])
    assert.strictEqual(code, 1)
    assert.ok(stderr.includes('Error: Missing required arguments'))
})

test('exits with error for invalid registry URL', async () => {
    const { code, stderr } = await runCli(['not-a-url', 'user', 'pass', 'email@test.com'])
    assert.strictEqual(code, 1)
    assert.ok(stderr.includes('Invalid registry URL'))
})

test('exits with error for registry URL without protocol', async () => {
    const { code, stderr } = await runCli(['registry.npmjs.org', 'user', 'pass', 'email@test.com'])
    assert.strictEqual(code, 1)
    assert.ok(stderr.includes('Invalid registry URL'))
})

test('exits with error for non-http/https protocol', async () => {
    const { code, stderr } = await runCli(['ftp://registry.npmjs.org', 'user', 'pass', 'email@test.com'])
    assert.strictEqual(code, 1)
    assert.ok(stderr.includes('Invalid registry URL'))
})

test('accepts valid https registry URL', async () => {
    // This will pass validation but fail to connect (expected)
    const result = await runCli(['https://registry.npmjs.org', 'user', 'pass', 'email@test.com'])
    // Should NOT exit with validation error
    assert.ok(!result.stderr.includes('Invalid registry URL'))
    assert.ok(!result.stderr.includes('Missing required arguments'))
})

test('accepts valid http registry URL', async () => {
    const result = await runCli(['http://localhost:4873', 'user', 'pass', 'email@test.com'])
    // Should NOT exit with validation error
    assert.ok(!result.stderr.includes('Invalid registry URL'))
    assert.ok(!result.stderr.includes('Missing required arguments'))
})
