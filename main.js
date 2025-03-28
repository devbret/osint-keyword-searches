document.addEventListener("DOMContentLoaded", () => {
  const API_URL_GET = "http://127.0.0.1:5501/get_queries";
  const API_URL_UPDATE = "http://127.0.0.1:5501/update_queries";
  const API_URL_INCREMENT_CLICK = "http://127.0.0.1:5501/increment_click";
  const API_URL_DELETE_QUERY = "http://127.0.0.1:5501/delete_query";
  const fetchHeaders = {
    "Content-Type": "application/json",
  };

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL_GET, {
        method: "GET",
        headers: fetchHeaders,
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.sort((a, b) =>
        String(a[0]).trim().localeCompare(String(b[0]).trim())
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const createStatsPanel = () => {
    const statsPanel = document.createElement("div");
    statsPanel.classList.add("stats-panel");
    statsPanel.innerHTML = `
                    <h2 class="stats-panel-header">Quick Stats</h2>
                    <p class="totalNumberOfKeywords">0 keywords displayed</p>
                    <p class="totalNumberOfClicks">0 total clicks this session</p>
                `;
    document.body.appendChild(statsPanel);
    return statsPanel;
  };

  const updateKeywordsCount = (count) => {
    document.querySelector(
      ".totalNumberOfKeywords"
    ).innerText = `${count} keywords displayed`;
  };

  const updateClicksCount = (count) => {
    document.querySelector(
      ".totalNumberOfClicks"
    ).innerText = `${count} total clicks this session`;
  };

  const createKeywordList = (keywords) => {
    const listElem = document.querySelector("ul");
    keywords.forEach((keyword) => {
      const [keywordText, clickCount] = keyword;
      const formattedKeyword = keywordText.split(" ").join("+");
      const innerLineItemElem = document.createElement("li");
      innerLineItemElem.innerHTML = `
                        <p><span class="keyword">${keywordText}</span>
                        <span class="click-count">${clickCount} clicks</span>
                        <span class="bucket">
                            <a href="https://www.google.com/search?q=${formattedKeyword}" target="_blank" class="platform">Google</a> 
                            <span class="search"><a href="https://www.google.com/search?q=${formattedKeyword}&tbs=qdr:d" target="_blank">D</a></span>
                            <span class="search"><a href="https://www.google.com/search?q=${formattedKeyword}&tbs=qdr:w" target="_blank">W</a></span>
                            <span class="search"><a href="https://www.google.com/search?q=${formattedKeyword}&tbs=qdr:m" target="_blank">M</a></span>
                        </span> 
                        <span class="bucket">
                            <a href="https://www.youtube.com/results?search_query=${formattedKeyword}" target="_blank" class="platform">YouTube</a> 
                            <span class="search"><a href="https://www.youtube.com/results?search_query=${formattedKeyword}&sp=EgIIAg%253D%253D" target="_blank">D</a></span>
                            <span class="search"><a href="https://www.youtube.com/results?search_query=${formattedKeyword}&sp=EgQIAxAB" target="_blank">W</a></span>
                            <span class="search"><a href="https://www.youtube.com/results?search_query=${formattedKeyword}&sp=EgQIBBAB" target="_blank">M</a></span>
                        </span> 
                        <span class="bucket">
                            <a href="https://old.reddit.com/search/?q=${formattedKeyword}" target="_blank" class="platform">Reddit</a> 
                            <span class="search"><a href="https://old.reddit.com/search/?q=${formattedKeyword}&t=day" target="_blank">D</a></span>
                            <span class="search"><a href="https://old.reddit.com/search/?q=${formattedKeyword}&t=week" target="_blank">W</a></span>
                            <span class="search"><a href="https://old.reddit.com/search/?q=${formattedKeyword}&t=month" target="_blank">M</a></span>
                        </span> 
                        <span class="bucket">
                            <a href="https://bsky.app/search?q=${formattedKeyword}" target="_blank" class="platform">Bluesky</a> 
                            <span class="search"><a href="https://bsky.app/search?q=${formattedKeyword}" target="_blank">T</a></span>
                        </span></p>
                        <p class="close-keyword">X</p>
                    `;
      listElem.appendChild(innerLineItemElem);
      innerLineItemElem
        .querySelector(".close-keyword")
        .addEventListener("click", () => removeKeyword(innerLineItemElem));

      innerLineItemElem.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", async () => {
          const platformLink = a.closest(".bucket")?.querySelector(".platform");

          const platform = platformLink
            ? platformLink.innerText.trim()
            : "Unknown";

          await incrementClickCount(keywordText, platform);
        });
      });

      const removeKeyword = (elem) => {
        fetch(API_URL_DELETE_QUERY, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: keywordText }),
        })
          .then((response) => {
            if (!response.ok) {
              return response.json().then((err) => {
                throw new Error(err.error || "Failed to delete keyword");
              });
            }
            return response.json();
          })
          .then((data) => {
            console.log(data.message);

            const listElem = document.querySelector("ul");
            listElem.removeChild(elem);

            updateKeywordsData();
            updateKeywordsCount(document.querySelectorAll(".keyword").length);
          })
          .catch((error) => {
            console.error("Error deleting keyword:", error.message);
            alert(`Error: ${error.message}`);
          });
      };
    });
  };

  const updateKeywordsData = async () => {
    const remainingKeywords = Array.from(
      document.querySelectorAll(".keyword")
    ).map((elem) => elem.innerText);
    try {
      const response = await fetch(API_URL_UPDATE, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify({ query: remainingKeywords }),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      await response.json();
    } catch (error) {
      console.error("Error updating keywords:", error);
    }
  };

  const incrementClickCount = async (keyword, platform) => {
    try {
      const response = await fetch(API_URL_INCREMENT_CLICK, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify({ query: keyword, platform: platform }),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      await response.json();

      const keywordElem = Array.from(
        document.querySelectorAll(".keyword")
      ).find((elem) => elem.innerText === keyword);
      if (keywordElem) {
        const clickCountElem = keywordElem.nextElementSibling;
        if (clickCountElem) {
          clickCountElem.innerText =
            parseInt(clickCountElem.innerText) + 1 + " clicks";
        }
      }
    } catch (error) {
      console.error("Error incrementing click count:", error);
    }
  };

  const addKeywordSearchFunctionality = () => {
    let totalClicks = 0;
    document.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        totalClicks += 1;
        updateClicksCount(totalClicks);
      });
    });

    const searchBar = document.createElement("input");
    searchBar.placeholder = "Search keywords here";
    searchBar.classList.add("search-bar");
    document.body.appendChild(searchBar);

    searchBar.addEventListener("input", () => {
      const searchValue = searchBar.value.toLowerCase();
      const keywordsToSearch = document.querySelectorAll(".keyword");
      let totalDisplayedKeywords = 0;
      keywordsToSearch.forEach((keywordElem) => {
        const keywordText = keywordElem.innerText.toLowerCase();
        const parentElem = keywordElem.parentElement.parentElement;
        if (keywordText.includes(searchValue)) {
          parentElem.style.display = "inline";
          totalDisplayedKeywords += 1;
        } else {
          parentElem.style.display = "none";
        }
      });
      updateKeywordsCount(totalDisplayedKeywords);
    });
  };

  const createButton = (text, className, onClick) => {
    const button = document.createElement("button");
    button.innerText = text;
    button.classList.add(className);
    button.addEventListener("click", onClick);
    document.body.appendChild(button);
  };

  const addCustomSearchButton = (keywords) => {
    createButton("Custom Search", "custom-search-button", () => {
      const bg = document.createElement("div");
      bg.classList.add("bg");
      document.body.appendChild(bg);

      const popup = document.createElement("div");
      popup.classList.add("popup");
      document.body.appendChild(popup);

      const closePopup = document.createElement("p");
      closePopup.classList.add("close-popup");
      closePopup.innerText = "X";
      popup.appendChild(closePopup);
      closePopup.onclick = () => {
        document.body.removeChild(bg);
        document.body.removeChild(popup);
      };
      bg.onclick = () => {
        document.body.removeChild(bg);
        document.body.removeChild(popup);
      };

      const centerPopup = () => {
        const popupWidth = popup.offsetWidth;
        const popupHeight = popup.offsetHeight;
        popup.style.left = `calc(50% - ${popupWidth / 2}px)`;
        popup.style.top = `calc(50% - ${popupHeight / 2}px)`;
      };

      const keywordSelect = document.createElement("select");
      keywordSelect.classList.add("keyword-select");
      keywordSelect.multiple = true;
      popup.appendChild(keywordSelect);
      keywords.forEach((keyword) => {
        const option = document.createElement("option");
        option.value = keyword[0];
        option.innerText = keyword[0];
        keywordSelect.appendChild(option);
      });

      $(".keyword-select").select2();

      const parameterDIV = document.createElement("div");
      parameterDIV.classList.add("parameter-DIV");
      popup.appendChild(parameterDIV);

      const timeframeSelect = document.createElement("select");
      timeframeSelect.classList.add("timeframe-select");
      parameterDIV.appendChild(timeframeSelect);
      const timeframes = [
        { text: "Day", value: "d" },
        { text: "Week", value: "w" },
        { text: "Month", value: "m" },
      ];
      timeframes.forEach((timeframe) => {
        const option = document.createElement("option");
        option.value = timeframe.value;
        option.innerText = timeframe.text;
        timeframeSelect.appendChild(option);
      });

      const platformSelect = document.createElement("select");
      platformSelect.classList.add("platform-select");
      parameterDIV.appendChild(platformSelect);
      const platforms = [
        { text: "Google", value: "google" },
        { text: "YouTube", value: "youtube" },
        { text: "Reddit", value: "reddit" },
        { text: "Bluesky", value: "bluesky" },
      ];
      platforms.forEach((platform) => {
        const option = document.createElement("option");
        option.value = platform.value;
        option.innerText = platform.text;
        platformSelect.appendChild(option);
      });

      platformSelect.onchange = () => {
        timeframeSelect.disabled = platformSelect.value === "twitter";
      };

      const searchTypeDiv = document.createElement("div");
      searchTypeDiv.style.display = "flex";
      searchTypeDiv.style.justifyContent = "center";
      searchTypeDiv.style.width = "100%";
      searchTypeDiv.style.margin = "20px 0";
      popup.appendChild(searchTypeDiv);

      const orCheckbox = document.createElement("input");
      orCheckbox.type = "checkbox";
      orCheckbox.id = "orCheckbox";
      orCheckbox.name = "searchType";
      orCheckbox.value = "OR";
      const orLabel = document.createElement("label");
      orLabel.htmlFor = "orCheckbox";
      orLabel.innerText = " OR ";
      searchTypeDiv.appendChild(orCheckbox);
      searchTypeDiv.appendChild(orLabel);

      const andCheckbox = document.createElement("input");
      andCheckbox.type = "checkbox";
      andCheckbox.id = "andCheckbox";
      andCheckbox.name = "searchType";
      andCheckbox.value = "AND";
      const andLabel = document.createElement("label");
      andLabel.htmlFor = "andCheckbox";
      andLabel.innerText = " AND ";
      searchTypeDiv.appendChild(andCheckbox);
      searchTypeDiv.appendChild(andLabel);

      orCheckbox.onclick = () => {
        if (orCheckbox.checked) {
          andCheckbox.checked = false;
        }
      };

      andCheckbox.onclick = () => {
        if (andCheckbox.checked) {
          orCheckbox.checked = false;
        }
      };

      const searchButton = document.createElement("button");
      searchButton.innerText = "Search";
      searchButton.classList.add("search-button");
      popup.appendChild(searchButton);

      searchButton.onclick = () => {
        const selectedKeywords = Array.from(keywordSelect.selectedOptions).map(
          (option) => option.value
        );
        if (!selectedKeywords.length) return;

        const timeframe = timeframeSelect.value;
        const platform = platformSelect.value;
        const isOrSearch = orCheckbox.checked;
        const isAndSearch = andCheckbox.checked;

        let formattedKeywords = "";

        if (isOrSearch) {
          formattedKeywords = selectedKeywords
            .map((kw) => `"${kw.split(" ").join("+")}"`)
            .join("+OR+");
        } else if (isAndSearch) {
          formattedKeywords = selectedKeywords
            .map((kw) => kw.split(" ").join("+"))
            .join("+");
        } else {
          formattedKeywords = selectedKeywords
            .map((kw) => kw.split(" ").join("+"))
            .join("+");
        }

        openSearchWindow(platform, formattedKeywords, timeframe);
      };

      setTimeout(centerPopup, 0);
    });
  };

  const openSearchWindow = (platform, keywords, timeframe) => {
    let url = "";
    switch (platform) {
      case "google":
        url = `https://www.google.com/search?q=${keywords}&tbs=qdr:${timeframe}`;
        break;
      case "youtube":
        const youtubeTimeframe =
          timeframe === "m"
            ? "EgQIBBAB"
            : timeframe === "d"
            ? "EgIIAg%253D%253D"
            : "EgQIAxAB";
        url = `https://www.youtube.com/results?search_query=${keywords}&sp=${youtubeTimeframe}`;
        break;
      case "reddit":
        url = `https://old.reddit.com/search/?q=${keywords}&t=${timeframe}`;
        break;
      case "bluesky":
        url = `https://bsky.app/search?q=${keywords}`;
        break;
    }
    window.open(url, "_blank");
  };

  const addNewKeywordButton = (keywords) => {
    createButton("Add", "add-button", () => {
      const bg = document.createElement("div");
      bg.classList.add("bg");
      document.body.appendChild(bg);
      const popup = document.createElement("div");
      popup.classList.add("popup");
      document.body.appendChild(popup);
      popup.style.left = `${window.innerWidth / 2 - 150}px`;
      const closePopup = document.createElement("p");
      closePopup.classList.add("close-popup");
      closePopup.innerText = "X";
      popup.appendChild(closePopup);
      closePopup.onclick = () => {
        document.body.removeChild(bg);
        document.body.removeChild(popup);
      };
      bg.onclick = () => {
        document.body.removeChild(bg);
        document.body.removeChild(popup);
      };

      const newKeywordInput = document.createElement("input");
      newKeywordInput.placeholder = "Enter keywords here";
      newKeywordInput.classList.add("new-keyword-input");
      popup.appendChild(newKeywordInput);
      const submitButton = document.createElement("button");
      submitButton.innerText = "Submit";
      submitButton.classList.add("submit-button");
      popup.appendChild(submitButton);

      submitButton.onclick = async () => {
        if (!newKeywordInput.value.trim()) return;
        const newKeywords = String(newKeywordInput.value)
          .toLowerCase()
          .split(",")
          .map((kw) => kw.trim())
          .filter(Boolean);
        const updatedKeywords = Array.from(
          new Set([...keywords.map((k) => k[0]), ...newKeywords])
        );

        try {
          const response = await fetch(API_URL_UPDATE, {
            method: "POST",
            headers: fetchHeaders,
            body: JSON.stringify({ query: updatedKeywords }),
          });
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          await response.json();
          location.reload();
        } catch (error) {
          console.error("Error updating keywords:", error);
        }
      };
    });

    createButton("Stats", "stats-button", () => {
      const bg = document.createElement("div");
      bg.classList.add("bg");
      document.body.appendChild(bg);

      const popup = document.createElement("div");
      popup.classList.add("popup");
      document.body.appendChild(popup);
      popup.style.left = `${window.innerWidth / 2 - 323}px`;

      const closePopup = document.createElement("p");
      closePopup.classList.add("close-popup");
      closePopup.innerText = "X";
      popup.appendChild(closePopup);

      closePopup.onclick = () => {
        document.body.removeChild(bg);
        document.body.removeChild(popup);
      };

      bg.onclick = () => {
        document.body.removeChild(bg);
        document.body.removeChild(popup);
      };

      const popupContainer = document.createElement("div");
      popupContainer.id = "popupContainer";
      popup.appendChild(popupContainer);

      fetch("http://localhost:5501/get_logs")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const parsedData = d3.csvParse(data.log_data);

          function generateDateRange(startDate, endDate) {
            const dateRange = [];
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
              dateRange.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
            }
            return dateRange;
          }

          const [minDate, maxDate] = d3.extent(
            parsedData,
            (d) => new Date(d["date and time"].split(" ")[0])
          );

          const fullDateRange = generateDateRange(minDate, maxDate);

          // Line Graph - Activities By Date
          const actionsByDate = d3.rollups(
            parsedData,
            (v) => v.length,
            (d) => d["date and time"].split(" ")[0]
          );

          const normalizedActionsByDate = fullDateRange.map((date) => {
            const dateString = date.toISOString().split("T")[0];
            const existingEntry = actionsByDate.find(
              (d) => d[0] === dateString
            );
            return existingEntry ? existingEntry : [dateString, 0];
          });

          normalizedActionsByDate.sort(
            (a, b) => new Date(a[0]) - new Date(b[0])
          );

          const dates = normalizedActionsByDate.map((d) => new Date(d[0]));
          const counts = normalizedActionsByDate.map((d) => d[1]);

          const logFileRetrievedData = parsedData.filter(
            (d) =>
              d["specific action taken"] === "Log file retrieved successfully"
          );

          const logFileRetrievedByDate = d3.rollups(
            logFileRetrievedData,
            (v) => v.length,
            (d) => d["date and time"].split(" ")[0]
          );

          const normalizedLogFileRetrievedByDate = fullDateRange.map((date) => {
            const dateString = date.toISOString().split("T")[0];
            const existingEntry = logFileRetrievedByDate.find(
              (d) => d[0] === dateString
            );
            return existingEntry ? existingEntry : [dateString, 0];
          });

          normalizedLogFileRetrievedByDate.sort(
            (a, b) => new Date(a[0]) - new Date(b[0])
          );

          const logFileCounts = normalizedLogFileRetrievedByDate.map(
            (d) => d[1]
          );

          const retrievedQueriesData = parsedData.filter(
            (d) => d["specific action taken"] === "Retrieved queries"
          );

          const retrievedQueriesByDate = d3.rollups(
            retrievedQueriesData,
            (v) => v.length,
            (d) => d["date and time"].split(" ")[0]
          );

          const normalizedRetrievedQueriesByDate = fullDateRange.map((date) => {
            const dateString = date.toISOString().split("T")[0];
            const existingEntry = retrievedQueriesByDate.find(
              (d) => d[0] === dateString
            );
            return existingEntry ? existingEntry : [dateString, 0];
          });

          normalizedRetrievedQueriesByDate.sort(
            (a, b) => new Date(a[0]) - new Date(b[0])
          );

          const retrievedCounts = normalizedRetrievedQueriesByDate.map(
            (d) => d[1]
          );

          const incrementedClickData = parsedData.filter((d) =>
            d["specific action taken"].startsWith("Incremented click count for")
          );

          const incrementedClickByDate = d3.rollups(
            incrementedClickData,
            (v) => v.length,
            (d) => d["date and time"].split(" ")[0]
          );

          const normalizedIncrementedClickByDate = fullDateRange.map((date) => {
            const dateString = date.toISOString().split("T")[0];
            const existingEntry = incrementedClickByDate.find(
              (d) => d[0] === dateString
            );
            return existingEntry ? existingEntry : [dateString, 0];
          });

          normalizedIncrementedClickByDate.sort(
            (a, b) => new Date(a[0]) - new Date(b[0])
          );

          const statsContainer = document.createElement("div");
          statsContainer.id = "statsContainer";
          popupContainer.appendChild(statsContainer);

          statsContainer.innerHTML += "<h2>Number Of Actions Daily</h2>";

          actionsByDate.sort((a, b) => new Date(a[0]) - new Date(b[0]));

          const width = 600;
          const height = 300;
          const margin = { top: 20, right: 30, bottom: 30, left: 40 };

          const xScale = d3
            .scaleTime()
            .domain(d3.extent(dates))
            .range([margin.left, width - margin.right]);

          const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(counts)])
            .nice()
            .range([height - margin.bottom, margin.top]);

          const svg = d3
            .select("#statsContainer")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

          const xAxis = d3
            .axisBottom(xScale)
            .tickFormat(d3.timeFormat("%Y-%m-%d"));
          const yAxis = d3.axisLeft(yScale);

          svg
            .append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

          svg
            .append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis);

          const line = d3
            .line()
            .x((d) => xScale(new Date(d[0])))
            .y((d) => yScale(d[1]));

          svg
            .append("path")
            .datum(normalizedActionsByDate)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

          svg
            .selectAll(".dot")
            .data(normalizedActionsByDate)
            .enter()
            .append("circle")
            .attr("cx", (d) => xScale(new Date(d[0])))
            .attr("cy", (d) => yScale(d[1]))
            .attr("r", 4)
            .attr("fill", "steelblue");

          yScale
            .domain([0, Math.max(d3.max(counts), d3.max(retrievedCounts))])
            .nice();

          const retrievedLine = d3
            .line()
            .x((d) => xScale(new Date(d[0])))
            .y((d) => yScale(d[1]));

          svg
            .append("path")
            .datum(normalizedRetrievedQueriesByDate)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 2)
            .attr("d", retrievedLine);

          svg
            .selectAll(".retrieved-dot")
            .data(normalizedRetrievedQueriesByDate)
            .enter()
            .append("circle")
            .attr("class", "retrieved-dot")
            .attr("cx", (d) => xScale(new Date(d[0])))
            .attr("cy", (d) => yScale(d[1]))
            .attr("r", 4)
            .attr("fill", "green");

          const incrementedCounts = normalizedIncrementedClickByDate.map(
            (d) => d[1]
          );

          yScale
            .domain([
              0,
              Math.max(
                d3.max(counts),
                d3.max(retrievedCounts),
                d3.max(incrementedCounts)
              ),
            ])
            .nice();

          const incrementedLine = d3
            .line()
            .x((d) => xScale(new Date(d[0])))
            .y((d) => yScale(d[1]));

          svg
            .append("path")
            .datum(normalizedIncrementedClickByDate)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("d", incrementedLine);

          svg
            .selectAll(".incremented-dot")
            .data(normalizedIncrementedClickByDate)
            .enter()
            .append("circle")
            .attr("class", "incremented-dot")
            .attr("cx", (d) => xScale(new Date(d[0])))
            .attr("cy", (d) => yScale(d[1]))
            .attr("r", 4)
            .attr("fill", "red");

          yScale
            .domain([
              0,
              Math.max(
                d3.max(counts),
                d3.max(retrievedCounts),
                d3.max(incrementedCounts),
                d3.max(logFileCounts)
              ),
            ])
            .nice();

          const logFileLine = d3
            .line()
            .x((d) => xScale(new Date(d[0])))
            .y((d) => yScale(d[1]));

          svg
            .append("path")
            .datum(normalizedLogFileRetrievedByDate)
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 2)
            .attr("d", logFileLine);

          svg
            .selectAll(".logfile-dot")
            .data(normalizedLogFileRetrievedByDate)
            .enter()
            .append("circle")
            .attr("class", "logfile-dot")
            .attr("cx", (d) => xScale(new Date(d[0])))
            .attr("cy", (d) => yScale(d[1]))
            .attr("r", 4)
            .attr("fill", "orange");

          const keywordAddedData = parsedData.filter(
            (d) =>
              d["type of action"] === "update_queries" &&
              d["specific action taken"] !== "[]"
          );

          const keywordAddedByDate = d3.rollups(
            keywordAddedData,
            (v) => v.length,
            (d) => d["date and time"].split(" ")[0]
          );

          const normalizedKeywordAddedByDate = fullDateRange.map((date) => {
            const dateString = date.toISOString().split("T")[0];
            const existingEntry = keywordAddedByDate.find(
              (d) => d[0] === dateString
            );
            return existingEntry ? existingEntry : [dateString, 0];
          });

          normalizedKeywordAddedByDate.sort(
            (a, b) => new Date(a[0]) - new Date(b[0])
          );

          const keywordCounts = normalizedKeywordAddedByDate.map((d) => d[1]);

          yScale
            .domain([
              0,
              Math.max(
                d3.max(counts),
                d3.max(retrievedCounts),
                d3.max(incrementedCounts),
                d3.max(logFileCounts),
                d3.max(keywordCounts)
              ),
            ])
            .nice();

          const keywordLine = d3
            .line()
            .x((d) => xScale(new Date(d[0])))
            .y((d) => yScale(d[1]));

          svg
            .append("path")
            .datum(normalizedKeywordAddedByDate)
            .attr("fill", "none")
            .attr("stroke", "purple")
            .attr("stroke-width", 2)
            .attr("d", keywordLine);

          svg
            .selectAll(".keyword-dot")
            .data(normalizedKeywordAddedByDate)
            .enter()
            .append("circle")
            .attr("class", "keyword-dot")
            .attr("cx", (d) => xScale(new Date(d[0])))
            .attr("cy", (d) => yScale(d[1]))
            .attr("r", 4)
            .attr("fill", "purple");

          const keywordDeletedData = parsedData.filter(
            (d) => d["type of action"] === "delete_query"
          );

          const keywordsDeletedByDate = d3.rollups(
            keywordDeletedData,
            (v) => v.length,
            (d) => d["date and time"].split(" ")[0]
          );

          const normalizedKeywordsDeletedByDate = fullDateRange.map((date) => {
            const dateString = date.toISOString().split("T")[0];
            const existingEntry = keywordsDeletedByDate.find(
              (d) => d[0] === dateString
            );
            return existingEntry ? existingEntry : [dateString, 0];
          });

          normalizedKeywordsDeletedByDate.sort(
            (a, b) => new Date(a[0]) - new Date(b[0])
          );

          const keywordDeletionCounts = normalizedKeywordsDeletedByDate.map(
            (d) => d[1]
          );

          yScale
            .domain([
              0,
              Math.max(
                d3.max(counts),
                d3.max(retrievedCounts),
                d3.max(incrementedCounts),
                d3.max(logFileCounts),
                d3.max(keywordCounts),
                d3.max(keywordDeletionCounts)
              ),
            ])
            .nice();

          const keywordDeletionLine = d3
            .line()
            .x((d) => xScale(new Date(d[0])))
            .y((d) => yScale(d[1]));

          svg
            .append("path")
            .datum(normalizedKeywordsDeletedByDate)
            .attr("fill", "none")
            .attr("stroke", "pink")
            .attr("stroke-width", 2)
            .attr("d", keywordDeletionLine);

          svg
            .selectAll(".keyword-deletion-dot")
            .data(normalizedKeywordsDeletedByDate)
            .enter()
            .append("circle")
            .attr("class", "keyword-deletion-dot")
            .attr("cx", (d) => xScale(new Date(d[0])))
            .attr("cy", (d) => yScale(d[1]))
            .attr("r", 4)
            .attr("fill", "pink");

          const legendContainer = document.createElement("div");
          legendContainer.id = "legendContainer";
          legendContainer.style.display = "flex";
          legendContainer.style.justifyContent = "space-around";
          legendContainer.style.alignItems = "center";
          legendContainer.style.margin = "10px 0px";
          statsContainer.appendChild(legendContainer);

          const legendItems = [
            { color: "steelblue", label: "Total" },
            { color: "green", label: "Loads" },
            { color: "red", label: "Queries" },
            { color: "orange", label: "Stats" },
            { color: "purple", label: "Added" },
            { color: "pink", label: "Deleted" },
          ];

          legendContainer.innerHTML = "";
          legendItems.forEach((item) => {
            const legendItem = document.createElement("div");
            legendItem.style.display = "flex";
            legendItem.style.alignItems = "center";
            legendItem.style.marginRight = "10px";

            const colorBox = document.createElement("div");
            colorBox.style.width = "20px";
            colorBox.style.height = "20px";
            colorBox.style.backgroundColor = item.color;
            colorBox.style.marginRight = "8px";
            legendItem.appendChild(colorBox);

            const label = document.createElement("span");
            label.textContent = item.label;
            label.style.fontSize = "12px";
            legendItem.appendChild(label);

            legendContainer.appendChild(legendItem);
          });

          // Bar Graph - Platform Activity
          const statsContainerPlatformActivity = document.createElement("div");
          statsContainerPlatformActivity.id = "statsContainerPlatformActivity";
          popupContainer.appendChild(statsContainerPlatformActivity);

          statsContainerPlatformActivity.innerHTML +=
            "<h2>Activity By Platform</h2>";

          const platformCounts = d3.rollups(
            parsedData
              .filter(
                (d) =>
                  d["specific action taken"] &&
                  d["specific action taken"].includes("on platform:")
              )
              .map((d) => {
                const match =
                  d["specific action taken"].match(/on platform: (\w+)/);
                return match ? match[1] : null;
              })
              .filter(Boolean),
            (v) => v.length,
            (d) => d
          );

          platformCounts.sort((a, b) => b[1] - a[1]);

          const barWidth = 600;
          const barHeight = 300;
          const barMargin = { top: 20, right: 30, bottom: 50, left: 50 };

          const barXScale = d3
            .scaleBand()
            .domain(platformCounts.map((d) => d[0]))
            .range([barMargin.left, barWidth - barMargin.right])
            .padding(0.1);

          const barYScale = d3
            .scaleLinear()
            .domain([0, d3.max(platformCounts, (d) => d[1])])
            .nice()
            .range([barHeight - barMargin.bottom, barMargin.top]);

          const barSvg = d3
            .select("#statsContainerPlatformActivity")
            .append("svg")
            .attr("width", barWidth)
            .attr("height", barHeight);

          const barXAxis = d3.axisBottom(barXScale);
          const barYAxis = d3.axisLeft(barYScale);

          barSvg
            .append("g")
            .attr("transform", `translate(0,${barHeight - barMargin.bottom})`)
            .call(barXAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

          barSvg
            .append("g")
            .attr("transform", `translate(${barMargin.left},0)`)
            .call(barYAxis);

          barSvg
            .selectAll(".bar")
            .data(platformCounts)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d) => barXScale(d[0]))
            .attr("y", (d) => barYScale(d[1]))
            .attr("width", barXScale.bandwidth())
            .attr(
              "height",
              (d) => barHeight - barMargin.bottom - barYScale(d[1])
            )
            .attr("fill", "steelblue");

          barSvg
            .selectAll(".label")
            .data(platformCounts)
            .enter()
            .append("text")
            .attr("x", (d) => barXScale(d[0]) + barXScale.bandwidth() / 2)
            .attr("y", (d) => barYScale(d[1]) - 5)
            .attr("text-anchor", "middle")
            .text((d) => d[1]);

          // Bar Graph - Top Searches
          const topSearchesContainer = document.createElement("div");
          topSearchesContainer.id = "topSearchesContainer";
          popupContainer.appendChild(topSearchesContainer);

          topSearchesContainer.innerHTML += "<h2>Top Searches</h2>";

          const topSearchesPlatformCounts = d3.rollups(
            parsedData
              .filter((dataRow) =>
                dataRow["specific action taken"].includes(
                  "Incremented click count for:"
                )
              )
              .map((dataRow) => {
                const match = dataRow["specific action taken"].match(
                  /Incremented click count for: (.*?) on platform: (.*?)$/
                );
                return match ? { keyword: match[1], platform: match[2] } : null;
              })
              .filter(Boolean),
            (group) => group.length,
            (data) => data.keyword,
            (data) => data.platform
          );

          let topSearchesStackableData = topSearchesPlatformCounts.map(
            ([keyword, platformData]) => {
              const row = { keyword };
              platformData.forEach(([platform, count]) => {
                row[platform] = count;
              });
              return row;
            }
          );

          topSearchesStackableData = topSearchesStackableData
            .sort((a, b) => {
              const sumA = Object.keys(a)
                .filter((key) => key !== "keyword")
                .reduce((sum, platform) => sum + a[platform], 0);
              const sumB = Object.keys(b)
                .filter((key) => key !== "keyword")
                .reduce((sum, platform) => sum + b[platform], 0);
              return sumB - sumA;
            })
            .slice(0, 33);

          const topSearchesPlatforms = Array.from(
            new Set(
              topSearchesStackableData.flatMap((row) =>
                Object.keys(row).filter((key) => key !== "keyword")
              )
            )
          );

          const topSearchesChartWidth = 600;
          const topSearchesChartHeight = 400;
          const topSearchesMargin = {
            top: 20,
            right: 30,
            bottom: 100,
            left: 50,
          };

          const topSearchesXScale = d3
            .scaleBand()
            .domain(topSearchesStackableData.map((d) => d.keyword))
            .range([
              topSearchesMargin.left,
              topSearchesChartWidth - topSearchesMargin.right,
            ])
            .padding(0.1);

          const topSearchesYScale = d3
            .scaleLinear()
            .domain([
              0,
              d3.max(topSearchesStackableData, (d) =>
                topSearchesPlatforms.reduce(
                  (sum, platform) => sum + (d[platform] || 0),
                  0
                )
              ),
            ])
            .nice()
            .range([
              topSearchesChartHeight - topSearchesMargin.bottom,
              topSearchesMargin.top,
            ]);

          const topSearchesColorScale = d3
            .scaleOrdinal()
            .domain(topSearchesPlatforms)
            .range(d3.schemeTableau10);

          const topSearchesSvg = d3
            .select("#topSearchesContainer")
            .append("svg")
            .attr("width", topSearchesChartWidth)
            .attr("height", topSearchesChartHeight);

          const topSearchesStack = d3.stack().keys(topSearchesPlatforms);
          const topSearchesStackedData = topSearchesStack(
            topSearchesStackableData
          );

          topSearchesSvg
            .append("g")
            .attr(
              "transform",
              `translate(0,${
                topSearchesChartHeight - topSearchesMargin.bottom
              })`
            )
            .call(d3.axisBottom(topSearchesXScale).tickSizeOuter(0))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

          topSearchesSvg
            .append("g")
            .attr("transform", `translate(${topSearchesMargin.left},0)`)
            .call(d3.axisLeft(topSearchesYScale).ticks(null, "s"));

          topSearchesSvg
            .selectAll(".layer")
            .data(topSearchesStackedData)
            .enter()
            .append("g")
            .attr("fill", (d) => topSearchesColorScale(d.key))
            .selectAll("rect")
            .data((d) => d)
            .enter()
            .append("rect")
            .attr("x", (d) => topSearchesXScale(d.data.keyword))
            .attr("y", (d) => topSearchesYScale(d[1]))
            .attr(
              "height",
              (d) => topSearchesYScale(d[0]) - topSearchesYScale(d[1])
            )
            .attr("width", topSearchesXScale.bandwidth());

          const topSearchesLegend = topSearchesSvg
            .selectAll(".legend")
            .data(topSearchesPlatforms)
            .enter()
            .append("g")
            .attr(
              "transform",
              (d, i) =>
                `translate(${
                  topSearchesChartWidth - topSearchesMargin.right - 100
                }, ${topSearchesMargin.top + i * 20})`
            );

          topSearchesLegend
            .append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", (d) => topSearchesColorScale(d));

          topSearchesLegend
            .append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("text-anchor", "start")
            .text((d) => d);

          // Heatmap Graph - Hourly Activity
          const hourlyActivity = d3.rollups(
            parsedData,
            (v) => v.length,
            (d) => {
              const dateTime = new Date(d["date and time"]);
              return `${dateTime.getDay()}-${dateTime.getHours()}`;
            }
          );

          const heatmapData = Array.from({ length: 7 }, () =>
            Array(24).fill(0)
          );

          hourlyActivity.forEach(([key, count]) => {
            const [day, hour] = key.split("-").map(Number);
            heatmapData[day][hour] = count;
          });

          const statsContainerHourlyActivity = document.createElement("div");
          statsContainerHourlyActivity.id = "statsContainerHourlyActivity";
          popupContainer.appendChild(statsContainerHourlyActivity);

          statsContainerHourlyActivity.innerHTML += "<h2>Hourly Activity</h2>";

          const heatmapWidth = 600;
          const heatmapHeight = 300;
          const heatmapMargin = {
            top: 10,
            right: 30,
            bottom: 30,
            left: 40,
          };

          const heatmapX = d3
            .scaleBand()
            .domain(d3.range(24))
            .range([heatmapMargin.left, heatmapWidth - heatmapMargin.right])
            .padding(0.05);

          const heatmapY = d3
            .scaleBand()
            .domain(d3.range(7))
            .range([heatmapMargin.top, heatmapHeight - heatmapMargin.bottom])
            .padding(0.05);

          const heatmapColor = d3
            .scaleSequential(d3.interpolateOranges)
            .domain([0, d3.max(heatmapData.flat())]);

          const heatmapSvg = d3
            .select("#statsContainerHourlyActivity")
            .append("svg")
            .attr("width", heatmapWidth)
            .attr("height", heatmapHeight);

          heatmapSvg
            .selectAll("rect")
            .data(
              heatmapData.flatMap((row, day) =>
                row.map((count, hour) => ({ day, hour, count }))
              )
            )
            .enter()
            .append("rect")
            .attr("x", (d) => heatmapX(d.hour))
            .attr("y", (d) => heatmapY(d.day))
            .attr("width", heatmapX.bandwidth())
            .attr("height", heatmapY.bandwidth())
            .attr("fill", (d) => heatmapColor(d.count));

          heatmapSvg
            .append("g")
            .attr(
              "transform",
              `translate(0,${heatmapHeight - heatmapMargin.bottom})`
            )
            .call(d3.axisBottom(heatmapX).tickFormat((d) => `${d}:00`));

          heatmapSvg
            .append("g")
            .attr("transform", `translate(${heatmapMargin.left},0)`)
            .call(
              d3
                .axisLeft(heatmapY)
                .tickFormat(
                  (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]
                )
            );
        })
        .catch((error) => {
          console.error("Error fetching log data:", error);
          statsContainer.innerHTML =
            "<p>Failed to fetch stats. Check console for errors.</p>";
        });
    });
  };

  const initializeUI = async () => {
    const keywords = await fetchData();
    createStatsPanel();
    createKeywordList(keywords);
    updateKeywordsCount(keywords.length);
    addKeywordSearchFunctionality();
    addCustomSearchButton(keywords);
    addNewKeywordButton(keywords);
  };

  initializeUI();
});
