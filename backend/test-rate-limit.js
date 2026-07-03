// test-rate-limit.js
// Hits the login endpoint rapidly to test the rate limiter.
// We expect the first 10 requests to get a 401 (Invalid Credentials)
// and the 11th request onwards to get a 429 (Too Many Requests).

async function testRateLimiter() {
    console.log("Starting Rate Limiter Test...");
    console.log("Sending 12 rapid requests to /api/auth/login");

    for (let i = 1; i <= 12; i++) {
        try {
            const res = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: `test${i}@example.com`, password: "password123" })
            });

            const data = await res.json();
            
            if (res.status === 429) {
                console.log(`[Request ${i}] ✅ SUCCESS: Blocked by Rate Limiter. Status: 429`);
                console.log(`   Message: ${data.error}`);
            } else {
                console.log(`[Request ${i}] Passed through. Status: ${res.status}`);
            }
        } catch (err) {
            console.error(`[Request ${i}] Error:`, err.message);
        }
    }
}

testRateLimiter();
