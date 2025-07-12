const fs = require("fs");
const path = require("path");
const axios = require("axios");

// === CONFIGURATION ===
const baseURL =
    "https://storage.hivetoon.com/public/upload/series/eleceed/dAGRgtKRYw/";
const outputDir = path.join(__dirname, "eleceed-ch354");
const maxSlides = 100; // Max expected slides (can be adjusted)
const delay = 5; // delay between downloads in ms (1 second)

// Create output folder if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Download a single image and ensure it's valid
async function downloadImage(url, savePath) {
    try {
        const response = await axios.get(url, {
            responseType: "stream",
            validateStatus: (status) => status < 400, // Only accept 2XX and 3XX
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36",
                Referer: "https://hivetoons.org/",
                Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
        });

        // Ensure the response is an image
        if (
            !response.headers["content-type"] ||
            !response.headers["content-type"].startsWith("image")
        ) {
            response.data.destroy();
            return false;
        }

        // Write the image to disk
        const writer = fs.createWriteStream(savePath);
        response.data.pipe(writer);

        return new Promise((resolve) => {
            writer.on("finish", () => resolve(true));
            writer.on("error", () => {
                if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
                resolve(false);
            });
        });
    } catch (err) {
        if (err.response && err.response.status === 404) {
            return false;
        }
        console.error(`❌ Error downloading ${url}:`, err.message);
        return false;
    }
}

async function downloadAllSlides() {
    console.log("🔽 Starting download...\n");
    for (let i = 1; i <= maxSlides; i++) {
        const slideNum = String(i).padStart(2, "0");
        const url = `${baseURL}${slideNum}.webp`;
        const savePath = path.join(outputDir, `slide-${slideNum}.webp`);

        console.log(`📥 Downloading slide ${slideNum}...`);
        const success = await downloadImage(url, savePath);

        if (!success) {
            console.log(
                `🚫 Slide ${slideNum} not found or invalid. Stopping.\n`
            );
            break;
        } else {
            console.log(`✅ Slide ${slideNum} downloaded.`);
        }
        await sleep(delay);
    }
    console.log("✅ All done!");
}

downloadAllSlides().catch((err) => {
    console.error("❌ Error:", err.message);
});
