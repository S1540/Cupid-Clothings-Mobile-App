// Per-process abuse bound; production multi-instance deployment needs a shared limiter.
const buckets = new Map();
function userRequestLimit(req, res, next) {
  const now = Date.now();
  const key = req.user.uid;
  const previous = buckets.get(key);
  const bucket = previous && previous.until > now ? previous : { count: 0, until: now + 60000 };
  bucket.count++;
  buckets.set(key, bucket);
  if (buckets.size > 10000) for (const [id, entry] of buckets) if (entry.until <= now) buckets.delete(id);
  if (bucket.count > 30) return res.status(429).json({ code: "RATE_LIMITED", message: "Please wait before trying again." });
  next();
}
module.exports = { userRequestLimit };
