// URL of the CSV file
const csvUrl = "https://fbnycpublic.blob.core.windows.net/otherdata/Cost%20Per%20Lb.%20FY24.csv?sp=r&st=2025-02-26T19:31:53Z&se=2026-02-27T03:31:53Z&spr=https&sv=2022-11-02&sr=b&sig=uiMQE2ySuKtO5dQeKaWNOU4XxU96UnBF%2FNET%2FGUyxoY%3D";

let csvData = [];
let csvHeaders = [];

const categoryColumn = "Product Category";

async function fetchCSVData() {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (result) {
          csvData = result.data;
          csvHeaders = Object.keys(csvData[0] || {});
      
          // Loop through each row and add a new "Cost Per Lb" column
          csvData.forEach(row => {
            const cost = parseFloat(row["Sum of Amount (Debit)"]);
            const sumDistLbs = parseFloat(row["Sum of Dist Lbs"]);
            // Check if the values are valid numbers and avoid division by zero
            if (!isNaN(cost) && !isNaN(sumDistLbs) && sumDistLbs !== 0) {
              row["Cost Per Lb"] = (cost / sumDistLbs).toFixed(2); // or leave as a number if you prefer
            } else {
              row["Cost Per Lb"] = ""; // or handle errors as needed
            }
          });
      
          // Add the new column header if it's not already there
          if (!csvHeaders.includes("Cost Per Lb")) {
            csvHeaders.push("Cost Per Lb");
          }
      
          // Populate dropdown and display the table as before
          populateDropdown(csvData, categoryColumn);
          displayTable(csvHeaders, csvData);
          // Calculate and display total immediately:
            const total = crunchTotal(csvData);
            document.getElementById("total").textContent = total.toFixed(2);
        }
      });
  } catch (error) {
    console.error("Error fetching CSV:", error);
  }
}

// Populate the dropdown with unique product categories
function populateDropdown(data, categoryCol) {
  const dropdown = document.getElementById("categoryFilter");

  // Extract unique categories
  const categories = [...new Set(data.map(row => row[categoryCol] || ""))].filter(c => c !== "").sort();

  // Add each category as an option
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    dropdown.appendChild(option);
  });
}

function displayTable(headers, data) {
    // Define columns to remove
    const columnsToExclude = ["Sum of Amount (Debit)", "Sum of Dist Lbs"];
    
    // Filter headers to exclude unwanted columns
    const filteredHeaders = headers.filter(header => !columnsToExclude.includes(header));
  
    const table = document.getElementById("categoryTable");
    table.innerHTML = ""; // Clear previous content
  
    // Create table header row using the filtered headers
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    filteredHeaders.forEach(header => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Create table body using the filtered headers
    const tbody = document.createElement("tbody");
    data.forEach(row => {
      const tr = document.createElement("tr");
      filteredHeaders.forEach(header => {
        const td = document.createElement("td");
        td.textContent = row[header] || "";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }


  function crunchTotal(data) {
    let totalDebit = 0;
    let totalLbs = 0;
    
    data.forEach(row => {
      const cost = parseFloat(row["Sum of Amount (Debit)"]);
      const lbs = parseFloat(row["Sum of Dist Lbs"]);
      
      if (!isNaN(cost) && !isNaN(lbs)) {
        totalDebit += cost;
        totalLbs += lbs;
      }
    });
    
    // Avoid division by zero
    return totalLbs !== 0 ? totalDebit / totalLbs : 0;
  }
  
document.getElementById("categoryFilter").addEventListener("change", function () {
    const selectedCategory = this.value;
    let filteredData;
  
    // If no category is selected, show all data; otherwise, filter based on selected category
    if (selectedCategory === "") {
      filteredData = csvData;
    } else {
      filteredData = csvData.filter(row => row[categoryColumn] === selectedCategory);
    }
  
    // Re-display the table with the filtered data
    displayTable(csvHeaders, filteredData);
  
    // Calculate the total cost per lb from the filtered data
    const total = crunchTotal(filteredData);
  

    document.getElementById("selectedCategory").textContent = selectedCategory;
    document.getElementById("total").textContent = total.toFixed(2);
  });

document.getElementById("calculateDonation").addEventListener("click", function() {
    // Get the donation amount from the input box
    const donationInput = document.getElementById("donationAmount").value;
    const donationAmount = parseFloat(donationInput);
    
    // Get the average cost per lb from the "total" element
    const averageCost = parseFloat(document.getElementById("total").textContent);
    
    // Check that both values are valid and that averageCost is not zero
    if (!isNaN(donationAmount) && !isNaN(averageCost) && averageCost !== 0) {
      const pounds = donationAmount / averageCost;
      const meals = pounds/1.2;

      document.getElementById("result").textContent = `Your donation will provide an estimated ${pounds.toFixed(2)} pounds, or ${meals.toFixed(2)} meals.`;
    } else {
      document.getElementById("result").textContent = "Please enter a valid donation amount and ensure the cost data is loaded.";
    }
  });

  document.getElementById("resetButton").addEventListener("click", function() {
    // Reset the dropdown filter to its default (empty) option
    const dropdown = document.getElementById("categoryFilter");
    dropdown.value = "";
  
    // Clear the donation amount input
    document.getElementById("donationAmount").value = "";
  
    // Clear any result or selected category display
    document.getElementById("result").textContent = "";
    document.getElementById("selectedCategory").textContent = "";
  
    // Re-display the table using the original CSV data
    displayTable(csvHeaders, csvData);
  
    // Recalculate the total cost per lb for the full dataset
    const total = crunchTotal(csvData);
    document.getElementById("total").textContent = total.toFixed(2);
  });


fetchCSVData();
