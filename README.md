# OSINT Keyword Searches

![Build and organize your OSINT searches on different platforms, including Google, Reddit, YouTube and Bluesky.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/e72bbd40-7c45-4172-b046-d0bec18646d7.jpg)

Build and organize your OSINT searches on different platforms, including Google, Reddit, YouTube and Bluesky.

## Set Up

### Programs Needed

- [Git](https://git-scm.com/downloads)
- [Python](https://www.python.org/downloads/) (When installing on Windows, make sure you check the "[Add python 3.xx to PATH](https://hosting.photobucket.com/images/i/bernhoftbret/python.png)" box.)

### Steps

1. Install the above programs.
2. Open a shell window (For Windows open PowerShell, for MacOS open Terminal & for Linux open your distro's terminal emulator).
3. Clone this repository using `git` by running the following command: `git clone git@github.com:devbret/osint-keyword-searches.git`.
4. Navigate to the repo's directory by running: `cd osint-keyword-searches`.
5. Install the needed dependencies for running the script with the following command: `pip install -r requirements.txt`.
6. Run the script with the command `python3 app.py`.
7. To view the website's connections using the index.html file you will need to run a local web server. To do this run: `python3 -m http.server`.
8. Once the main interface has been launched, add OSINT keywords of interest by clicking on the "Add" button. Those keywords will now auto-populate, along with links to time based searches for different platforms.
9. Click on any of the links to visit the relevant platform for a specific timeframe and keyword.

## Analytics

![Screenshot of the first two data visualizations.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/e9d5ba13-8b09-4d48-b606-17b6e6bf518c.jpg)

This program also has usage analytics built-in. Which can be accessed by clicking the "Stats" button located at the top right of the application. Data visualizations include "Number Of Actions Daily", "Activity By Platform", "Top Searches" and "Hourly Activity".
