document.getElementById("new-quote").addEventListener("click", getQuote);

async function getQuote() {
  try {
    const response = await fetch("/quote");
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();
    document.getElementById("quote").innerText = `${data[0].q} — ${data[0].a}`;
  } catch (err) {
    document.getElementById("quote").innerText = "Failed to load quote.";
    console.error(err);
  }
}

getQuote(); // Load first quote on page load