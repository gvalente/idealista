Idealista Trust Shield 🛡️
==========================

**An open-source Chrome extension that adds a real-time "Trust & Quality Score" to property listings on Idealista, helping users navigate Barcelona's challenging real estate market with more confidence and safety.**


<img width="2206" height="979" alt="Flow 2 light" src="https://github.com/user-attachments/assets/48575444-efbf-4064-a6be-31ca87322496" />
(This is the streamlined user flow enabled by the Trust Shield)

* * * * *


The Problem: The Barcelona Renter's Gauntlet
--------------------------------------------

Finding a property on Idealista in a hyper-competitive market like Barcelona is a high-stakes, high-stress "gauntlet." Users, especially expats and students, face a triad of challenges:

-   **Rampant scams** that lead to significant financial loss and identity theft.

-   **An "information fog"** of low-quality, duplicate, or outdated listings.

-   **Intense market pressure** that erodes due diligence and forces rushed, risky decisions.

This extension was built to address these pain points directly, acting as an intelligent co-pilot for the user.


More Than a Plugin: An AI-Driven Build Experiment
-------------------------------------------------

This repository is more than just the source code for a browser extension; it's a public case study in **AI-augmented product development**.

The entire project---from initial user research to the final v10 UI design and this functional code---was conceived and executed within a **12-hour weekend sprint**. This was made possible by strategically partnering with a suite of AI tools to handle research, strategy, design, and code generation.

This "build in public" approach is part of a meta case study exploring the future of UX design and solo development. You can follow the entire process, including the prompts and tools used, which will be documented in an upcoming Medium article.

**The AI Toolkit:**

-   **Strategy, Research, & Code Logic:** Google's Gemini

-   **UI/UX Design & Prototyping:** v0 by Vercel

-   **Visual User Flows:** Eraser.io's DiagramGPT


Core Features (MVP)
-------------------

-   **Trust & Quality Score:** A consolidated, color-coded score (0-100) on every listing for at-a-glance assessment.

-   **Loading States:** A non-disruptive skeleton loader ensures no layout shift while scores are calculated.

-   **Analysis Breakdown:** An expandable modal that details the "why" behind the score, checking for:

    -   **Scam Keyword Detection:** Flags high-risk language.

    -   **Price Analysis:** Detects "too good to be true" pricing anomalies.

    -   **Listing Quality:** Rates the completeness of the listing (photo count, floor plan, etc.).

    -   **Listing Freshness:** Warns about outdated "ghost" listings.

    -   **Duplicate Check:** Identifies potentially duplicated properties.

    -   **Advertiser Check:** Flags suspicious advertiser details.

-   **Responsive Design:** A seamless experience on both desktop and mobile web, featuring a native-feeling bottom sheet on smaller viewports.

-   **Smart Caching:** Scores are cached locally to provide an instant experience on subsequent page loads.


Tech Stack
----------

-   **Framework:** React

-   **Styling:** CSS (Scoped for the Chrome extension environment)

-   **Platform:** Chrome Extension (Manifest V3)


Getting Started (For Developers)
--------------------------------

To run this extension locally for testing or development:

1.  **Clone the repository:**bash

    git clone https://github.com/your-username/idealista.git

2.  **Navigate to the project directory:**

    Bash

    ```
    cd idealista

    ```

3.  **Install dependencies** (assuming a `package.json` from v0's export):

    Bash

    ```
    npm install

    ```

4.  **Build the project** (if a build step is required):

    Bash

    ```
    npm run build

    ```

5.  **Load the extension in Chrome:**

    -   Open Chrome and navigate to `chrome://extensions`.

    -   Enable "Developer mode" in the top-right corner.

    -   Click "Load unpacked."

    -   Select the `build` or `dist` folder from this project.

    -   The Idealista Trust Shield icon should now appear in your toolbar!


Contributing
------------

This is an open-source experiment, and contributions are welcome! Whether it's fixing a bug, improving a feature, or suggesting a new one, please feel free to:

1.  Fork the repository.

2.  Create a new branch (`git checkout -b feature/your-feature-name`).

3.  Make your changes.

4.  Submit a pull request with a clear description of your changes.

License
-------

This project is licensed under the MIT License - see the `LICENSE.md` file for details.
