const api = typeof browser !== "undefined" ? browser : chrome;

document.getElementById('extract').addEventListener('click', async () => {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });

  api.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeData,
  }, async (results) => {
    if (results && results[0].result) {
      const data = results[0].result;
      const cnt = data.rows.length;
      const carDescRows = data.rows.map((row, i) => 
        `${i + 1}) ${row.carType}${(row.carShell===row.carType ? '' : ` ${row.carShell}`)} ${row.carMark} ${row.carModel}, ${row.carYear} р.в., ${row.carColor}${(row.carNumber.toLowerCase()==='не визначено' ? '': `, днз: ${row.carNumber}` )}, у власності з ${row.carAuthDate}, ${row.carOper}${i === cnt - 1 ? '.' : ';'}`
          .replace(' тз', ' ТЗ')
          .replace(' на нов. власн.', ' на нового власника')
      );
      // Формуємо фінальний рядок
      document.getElementById('personId').textContent = data.title;
      document.getElementById('result').innerHTML = carDescRows.map((row) =>
        `<div>${row}</div>`
      ).join('\n');
      await navigator.clipboard.writeText(carDescRows.join('\n'));
      document.getElementById('url').textContent = data.url;
    }
  });
});

// Ця функція виконується безпосередньо на сторінці сайту
function scrapeData() {
  ycSelectors = [
    {
      desc: "Private Person",
      sel: "#vehicle-owned-data",
      getValueFrom: (car, col) => car.querySelector(`.np-debtor-table-body-col:nth-child(${col})`)?.innerText.trim(),
      getDetailValueFrom: (car, col) => car.querySelector(`.np-debtor-detail-row tr:nth-child(${col}) td:nth-child(2)`)?.innerText.trim()
    },
    {
      desc: "Enterprise",
      sel: "#tab-vehiclesprops",
      getValueFrom: (car, col) => car.cells[col-1]?.innerText.trim(),
      getDetailValueFrom: (car, col) => car.nextElementSibling.querySelector("table")?.rows[col-1].cells[1].innerText.trim()
    }
  ];

  var rows = [];
  for (const { desc, sel, getValueFrom, getDetailValueFrom } of ycSelectors) {
    const cars = document.querySelector(sel);
    if (cars) {
      var i = 0;
      while (true) {
        const car = cars.querySelector(`[data-key='${i}']`);
        if (!car) break;
        rows.push({
          carType: getValueFrom(car, 6)?.toLowerCase(),
          carShell: getValueFrom(car, 7)?.toLowerCase(),
          carMark: getValueFrom(car, 2),
          carModel: getValueFrom(car, 3),
          carNumber: getValueFrom(car, 1),
          carYear: getValueFrom(car, 4),
          carColor: getValueFrom(car, 5)?.toLowerCase(),
          carAuthDate: getDetailValueFrom(car, 1),
          carOper: getDetailValueFrom(car, 3)?.toLowerCase()
        });
        i++;
      }
    }
  }
  return {
    title: document.querySelector(".yc-switcher-name,#card-reverse-name").innerText.trim(),
    rows: rows,
    url: window.location.href
  };
}