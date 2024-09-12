import puppeteer from 'puppeteer-extra';  //  used for browser automation
import StealthPlugin from 'puppeteer-extra-plugin-stealth';  // to make the automation less detectable by websites
import OpenAI from 'openai';
import readline from 'readline';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const openai = new OpenAI();
const timeout = 8000;

// reads an image file and converts it to a Base64-encoded string.
async function image_to_base64(image_file) {
    return await new Promise((resolve, reject) => {
        fs.readFile(image_file, (err, data) => {  //fs.readFile method is used to read the image file from the file system.
            if (err) {
                console.error('Error reading the file:', err);
                reject();
                return;
            }

            const base64Data = data.toString('base64');  // it converts the binary data to a Base64 string
            // data URI: a string format that embeds image data directly within HTML or other contexts. This is useful when you need to include an image directly in a web page or an API without using an external image file.
            const dataURI = `data:image/jpeg;base64, ${base64Data}`;  // The Base64 string is then formatted as a data URI for an image with the JPEG format
            resolve(dataURI);
        });
    });
}

// prompts the user for input via the command line and returns the input value as a string
async function input( text ) {
    let the_prompt;

    // rl is the readline interface, which allows you to prompt the user for input and capture their response.
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await (async () => {
        return new Promise( resolve => {
            rl.question( text, (prompt) => {  // prompts the user with the provided text message and waits for their input. The user's input is captured in the prompt variable.
                the_prompt = prompt;
                rl.close();  // closes the readline interface, indicating that no more input will be accepted.
                resolve();
            } );
        } );
    })();

    return the_prompt;  // After the promise is resolved, the function returns the the_prompt variable, which contains the user's input.
}

// introduces a delay (or sleep) in the execution of the code for a given number of milliseconds
async function sleep( milliseconds ) {
    // new Promise() constructor takes a function with two arguments: r (short for resolve) and _ (which could be used as reject, but it is unused here). The promise will be resolved after the specified delay.
    return await new Promise((r, _) => {
        setTimeout( () => {
            r();  // As soon as r() is called, the promise is resolved, and the sleep function completes.
        }, milliseconds );
    });
}

async function highlight_links( page ) {
    // Remove existing 'gpt-link-text' attributes from all elements
    await page.evaluate(() => {
        document.querySelectorAll('[gpt-link-text]').forEach(e => {
            e.removeAttribute("gpt-link-text");
        });
    });

    // Select all interactable elements (links, buttons, inputs, etc.)
    const elements = await page.$$(
        "a, button, input, textarea, [role=button], [role=treeitem]"
    );

    // Loop through each element
    elements.forEach( async e => {
        // Evaluate the following function in the browser context
        await page.evaluate(e => {

            // Function to check if an element is visible
            function isElementVisible(el) {
                if (!el) return false;  // If the element does not exist, return false
                
                // Check if the element's style properties indicate it is visible
                function isStyleVisible(el) {
                    const style = window.getComputedStyle(el);
                    return style.width !== '0' &&
                           style.height !== '0' &&
                           style.opacity !== '0' &&
                           style.display !== 'none' &&
                           style.visibility !== 'hidden';
                }

                // Check if the element is within the visible area of the viewport
                function isElementInViewport(el) {
                    const rect = el.getBoundingClientRect();
                    return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                    );
                }

                // Check if the element is visible style-wise
                if (!isStyleVisible(el)) {
                    return false;
                }

                // Traverse up the DOM and check if any ancestor element is hidden
                // Check all parent elements to ensure none are hidden
                let parent = el;
                while (parent) {
                    if (!isStyleVisible(parent)) {
                    return false;
                    }
                    parent = parent.parentElement;
                }

                // Finally, check if the element is within the viewport
                return isElementInViewport(el);
            }
            
            // If the element passes the visibility checks, it is highlighted by adding a red border around it
            e.style.border = "1px solid red";

            // Get the position and dimensions of the element
            const position = e.getBoundingClientRect();

            // If the element is visible, has a size, and passes visibility checks
            if( position.width > 5 && position.height > 5 && isElementVisible(e) ) {
                // Sanitize the text content and store it in the 'gpt-link-text' attribute
                const link_text = e.textContent.replace(/[^a-zA-Z0-9 ]/g, '');
                e.setAttribute( "gpt-link-text", link_text );
            }
        }, e);  // Pass each element to the evaluate function
    } );
}

// Asynchronous function that waits for a specified event to occur on the page
async function waitForEvent(page, event) {
    // Evaluate function inside the browser context to listen for the event
    return page.evaluate(event => {
        // Return a new Promise that resolves when the specified event occurs
        return new Promise((r, _) => {
            // Add an event listener for the specified event
            document.addEventListener(event, function(e) {
                // Resolve the promise when the event is triggered
                r();
            });
        });
    }, event)  // Pass the event type (e.g., 'click', 'keydown') to the evaluate function
}

// automates a browser, takes screenshots, and communicates with the GPT-4 API to assist with navigating websites and answering questions based on the current page.
(async () => {
    // Display a banner with program name in the console
    console.log( "###########################################" );
    console.log( "# GPT4V-Browsing by Unconventional Coding #" );
    console.log( "###########################################\n" );

    // Launch a Puppeteer browser instance in headless mode, meaning it runs in the background without opening a visible browser window.
    const browser = await puppeteer.launch( {
        headless: "new",  // 'new' option for modern headless mode
    } );

    // Open a new page in the browser
    const page = await browser.newPage();

    // Set the viewport to specific dimensions and scale factor
    await page.setViewport( {
        width: 1200,
        height: 1200,
        deviceScaleFactor: 1.75,  // Higher scale factor for higher resolution display
    } );

    // Initial system message to set GPT-4's role as a website crawler
    const messages = [
        {
            "role": "system",
            "content": `You are a website crawler. You will be given instructions on what to do by browsing. You are connected to a web browser and you will be given the screenshot of the website you are on. The links on the website will be highlighted in red in the screenshot. Always read what is in the screenshot. Don't guess link names.

                You can go to a specific URL by answering with the following JSON format:
                {"url": "url goes here"}

                You can click links on the website by referencing the text inside of the link/button, by answering in the following JSON format:
                {"click": "Text in link"}

                Once you are on a URL and you have found the answer to the user's question, you can answer with a regular message.

                In the beginning, go to a direct URL that you think might contain the answer to the user's question. Prefer to go directly to sub-urls like 'https://google.com/search?q=search' if applicable. Prefer to use Google for simple queries. If the user provides a direct URL, go to that one.`,
        }
    ];

    // Prompt the user for their question or instruction
    console.log("GPT: How can I assist you today?")
    const prompt = await input("You: ");
    console.log();

    // Add the user's prompt to the messages array for GPT-4 to process
    messages.push({
        "role": "user",
        "content": prompt,
    });

    let url; // Variable to hold URL for navigation
    let screenshot_taken = false; // Track whether a screenshot has been taken

    // Main loop to process website interactions and GPT-4 responses
    while( true ) {
        // If a URL is set, navigate to it
        if( url ) {
            console.log("Crawling " + url);
            await page.goto( url, {
                waitUntil: "domcontentloaded",  // Wait until the DOM is fully loaded
            } );

            // Highlight all clickable elements on the page
            await highlight_links( page );

            // Wait for the page to load or timeout after a certain period
            await Promise.race([
                waitForEvent(page, 'load'),  // Wait for load event
                sleep(timeout)  // Timeout to avoid getting stuck
            ]);

            // Take another screenshot after page loads and highlight elements
            await highlight_links( page );

            // Save the screenshot to a file
            await page.screenshot( {
                path: "screenshot.jpg",
                quality: 100,  // High-quality screenshot
            } );

            screenshot_taken = true;  // Set flag indicating a screenshot was taken
            url = null;  // Reset the URL variable
        }

        // If a screenshot was taken, process and send it to GPT-4
        if( screenshot_taken ) {
            // Convert screenshot to a base64 string for embedding in the response
            const base64_image = await image_to_base64("screenshot.jpg");

            // Send the screenshot and additional info to GPT-4 as a user message
            messages.push({
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": base64_image,  // Embedded screenshot
                    },
                    {
                        "type": "text",
                        "text": "Here's the screenshot of the website you are on right now. You can click on links with {\"click\": \"Link text\"} or you can crawl to another URL if this one is incorrect. If you find the answer to the user's question, you can respond normally.",
                    }
                ]
            });

            screenshot_taken = false;  // Reset the screenshot flag
        }

        // Send the current conversation (messages) to GPT-4 for a response
        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",  // Use GPT-4 vision model
            max_tokens: 1024,  // Set max tokens for response length
            //seed: 665234,
            messages: messages,  // Send full conversation history
        });

        // Extract GPT-4's response message
        const message = response.choices[0].message;
        const message_text = message.content;

        // Add GPT-4's response to the messages array
        messages.push({
            "role": "assistant",
            "content": message_text,
        });

        console.log( "GPT: " + message_text );

        // If GPT-4 suggests clicking a link
        if( message_text.indexOf('{"click": "') !== -1 ) {
            // Extract the link text from GPT-4's response
            let parts = message_text.split('{"click": "');
            parts = parts[1].split('"}');
            const link_text = parts[0].replace(/[^a-zA-Z0-9 ]/g, '');  // Clean the link text

            console.log("Clicking on " + link_text)

            try {
                // Find all elements on the page that have been highlighted
                const elements = await page.$$('[gpt-link-text]');

                let partial;  // Variable to store partial matches
                let exact;  // Variable to store exact matches

                // Loop through the highlighted elements
                for( const element of elements ) {
                    // Get the value of the 'gpt-link-text' attribute
                    const attributeValue = await element.getAttribute('gpt-link-text');

                    // Check for partial or exact matches with the link text
                    if( attributeValue.includes( link_text ) ) {
                        partial = element;
                    }

                    if( attributeValue === link_text ) {
                        exact = element;
                    }
                }

                // If an exact match is found, click it; otherwise, click the partial match
                if( exact ) {
                    await exact.click();
                } else if( partial ) {
                    await partial.click();
                } else {
                    throw new Error( "Can't find link" );
                }

                // Wait for the new page to load or timeout
                await Promise.race( [
                    waitForEvent(page, 'load'),
                    sleep(timeout)
                ] );

                // Highlight the new page's links and take a screenshot
                await highlight_links( page );

                await page.screenshot( {
                    path: "screenshot.jpg",
                    quality: 100,
                } );

                screenshot_taken = true;
            } catch( error ) {
                console.log( "ERROR: Clicking failed" );

                // If an error occurs, send an error message to GPT-4
                messages.push({
                    "role": "user",
                    "content": "ERROR: I was unable to click that element",
                });
            }

            continue;  // Restart the loop
        } else if( message_text.indexOf('{"url": "') !== -1 ) {
            // If GPT-4 suggests navigating to a new URL
            let parts = message_text.split('{"url": "');
            parts = parts[1].split('"}');
            url = parts[0];  // Extract the URL to navigate to

            continue;  // Restart the loop to navigate to the new URL
        }

        // Prompt the user for the next input and continue the conversation
        const prompt = await input("You: ");
        console.log();

        // Add the user's new prompt to the messages array
        messages.push({
            "role": "user",
            "content": prompt,
        });
    }
})();
