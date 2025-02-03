fetch("http://localhost:5000/api/sheet/1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "Points": 2 })
})
.then(response => response.text()) // Get response as text first
.then(text => {
    console.log("Raw Response:", text); // Log raw response before parsing
    return JSON.parse(text); // Try to parse as JSON
})
.then(data => console.log("Success:", data))
.catch(error => console.error("Error:", error));
