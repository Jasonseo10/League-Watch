import fs from 'fs'
import https from 'https'

export interface LCUCredentials {
  protocol: string
  port: number
  password: string
  pid: number
}

export class LCUConnection {
  private lockfilePath: string

  constructor(lockfilePath: string) {
    this.lockfilePath = lockfilePath
  }

  /**
   * Read and parse the lockfile to extract LCU credentials.
   * Lockfile format: processName:pid:port:password:protocol
   */
  async getCredentials(): Promise<LCUCredentials | null> {
    try {
      // Read lockfile - it may be locked by the League client, so we use a copy approach
      const content = await this.readLockfile()
      if (!content) return null

      const parts = content.trim().split(':')
      if (parts.length < 5) {
        console.error('[LCU] Invalid lockfile format')
        return null
      }

      return {
        pid: parseInt(parts[1], 10),
        port: parseInt(parts[2], 10),
        password: parts[3],
        protocol: parts[4],
      }
    } catch {
      return null
    }
  }

  /**
   * Read lockfile content. The file may be locked by the League client process,
   * so we use fs.read with a shared flag.
   */
  private readLockfile(): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        // Use 'r' flag with a file descriptor opened for shared reading
        const fd = fs.openSync(this.lockfilePath, 'r')
        const buffer = Buffer.alloc(256)
        const bytesRead = fs.readSync(fd, buffer, 0, 256, 0)
        fs.closeSync(fd)
        if (bytesRead === 0) {
          resolve(null)
        } else {
          resolve(buffer.toString('utf8', 0, bytesRead))
        }
      } catch {
        resolve(null)
      }
    })
  }

  /**
   * Make an authenticated HTTPS request to the LCU API.
   */
  static request(credentials: LCUCredentials, method: string, endpoint: string, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: '127.0.0.1',
        port: credentials.port,
        path: endpoint,
        method,
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`riot:${credentials.password}`).toString('base64'),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // IMPORTANT: LCU uses a self-signed certificate
        rejectUnauthorized: false,
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : null)
          } catch {
            resolve(data)
          }
        })
      })

      req.on('error', reject)

      if (body) {
        req.write(JSON.stringify(body))
      }
      req.end()
    })
  }
}
