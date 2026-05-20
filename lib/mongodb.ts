import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI env var is required')
}

const mongoUri = MONGODB_URI

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null | undefined
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | null | undefined
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongooseConn) return global._mongooseConn

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose.connect(mongoUri)
  }

  global._mongooseConn = await global._mongoosePromise
  return global._mongooseConn
}
