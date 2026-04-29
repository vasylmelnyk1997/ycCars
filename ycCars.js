document.getElementById('extract').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeData,
  }, async (results) => {
    if (results && results[0].result) {
      const data = results[0].result;
      const cnt = data.rows.length;
      const carDescRows = data.rows.map((row, i) => 
        `${row.carType}${(row.carShell===row.carType ? '' : ` ${row.carShell}`)} ${row.carMark} ${row.carModel}, ${row.carYear} р.в.${(row.carNumber.toLowerCase()==='не визначено' ? '': `, днз: ${row.carNumber}` )}, ${row.carColor}, у власності з ${row.carAuthDate}, ${row.carOper}${i === cnt - 1 ? '.' : ';'}`
      );
      // Формуємо фінальний рядок
      document.getElementById('personId').textContent = data.title;
      document.getElementById('result').innerHTML = carDescRows.map((row) =>
        `<li>${row}</li>`
      ).join('\n');
      await navigator.clipboard.writeText(carDescRows.join('\n'));
      document.getElementById('url').textContent = data.url;
    }
  });
});

// Ця функція виконується безпосередньо на сторінці сайту
function scrapeData() {
  const cars = document.querySelector("#vehicle-owned-data");
  var rows = [];
  if (cars) {
    var i = 0;
    while (true) {
      const car = cars.querySelector(`[data-key='${i}']`);
      if (!car) break;
      const getSelector = (col) => `.np-debtor-table-body-col:nth-child(${col})`;
      const getDetailSelector = (col) => `.np-debtor-detail-row tr:nth-child(${col}) td:nth-child(2)`;
      rows.push({
        carType: car.querySelector(getSelector(6)).innerText.trim().toLowerCase(),
        carShell: car.querySelector(getSelector(7)).innerText.trim().toLowerCase(),
        carMark: car.querySelector(getSelector(2)).innerText.trim(),
        carModel: car.querySelector(getSelector(3)).innerText.trim(),
        carNumber: car.querySelector(getSelector(1)).innerText.trim(),
        carYear: car.querySelector(getSelector(4)).innerText.trim(),
        carColor: car.querySelector(getSelector(5)).innerText.toLowerCase(),
        carAuthDate: car.querySelector(getDetailSelector(1)).innerText.trim(),
        carOper: car.querySelector(getDetailSelector(3)).innerText.toLowerCase()
      });
      i++;
    }
  }
  return {
    title: document.getElementsByClassName("yc-switcher-name")[0].innerText.trim(),
    rows: rows,
    url: window.location.href
  };
}