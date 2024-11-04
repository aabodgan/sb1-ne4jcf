import React from 'react';
import { FileText, Image, Download, CheckCircle, Copy, Check } from 'lucide-react';

export function Instructions() {
  const [copied, setCopied] = React.useState(false);

  const sqlQuery = `set @brand = 1594;

SELECT 
pa.id, 
pa.art_num
FROM \`prices_all\` pa
LEFT JOIN resource_v2 r on r.pa_id = pa.id and r.\`status\` = 1
LEFT JOIN dok_ga dg on dg.GA_ID = pa.pa_ga_id_search
LEFT JOIN brand_all ba on ba.id = pa.brand_id
LEFT JOIN price_sku ps on ps.pa_id = pa.id
LEFT JOIN tecdoc_2016q1_europe.LINK_GRA_ART lga on lga.LGA_ART_ID = pa.pa_art_id
LEFT JOIN tecdoc_2016q1_europe.GRAPHICS g ON GRA_ID = lga.LGA_GRA_ID
WHERE ps.pa_id is null 
and pa.brand_id = @brand
and r.pa_id is null 
and g.GRA_ID is null
GROUP BY pa.id`;

  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(sqlQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Як користуватись програмою</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#f8f9fa] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#e3f2fd] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#2196f3]" />
            </div>
            <span className="font-medium">Крок 1</span>
          </div>
          <p className="text-sm text-gray-600">
            Підготуйте файл відповідності (.txt або .csv) з двома колонками: ID та артикул, розділені табуляцією
          </p>
        </div>

        <div className="p-4 bg-[#f8f9fa] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#e8f5e9] flex items-center justify-center">
              <Image className="w-5 h-5 text-[#4caf50]" />
            </div>
            <span className="font-medium">Крок 2</span>
          </div>
          <p className="text-sm text-gray-600">
            Перетягніть фотографії у відповідну область або натисніть для вибору файлів
          </p>
        </div>

        <div className="p-4 bg-[#f8f9fa] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#fff3e0] flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#ff9800]" />
            </div>
            <span className="font-medium">Крок 3</span>
          </div>
          <p className="text-sm text-gray-600">
            Натисніть кнопку "Перейменувати" та дочекайтесь завершення обробки
          </p>
        </div>

        <div className="p-4 bg-[#f8f9fa] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#fce4ec] flex items-center justify-center">
              <Download className="w-5 h-5 text-[#e91e63]" />
            </div>
            <span className="font-medium">Крок 4</span>
          </div>
          <p className="text-sm text-gray-600">
            Завантажте оброблені файли або перегляньте звіт про помилки
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="bg-[#f8f9fa] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-[#2c3e50]">SQL запит для створення файлу відповідності:</h3>
            <button
              onClick={handleCopyQuery}
              className="flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-[#e3f2fd] text-[#2196f3] 
                hover:bg-[#bbdefb] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Скопійовано
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Копіювати
                </>
              )}
            </button>
          </div>
          <div className="bg-[#2d3748] rounded-lg p-4 overflow-x-auto">
            <pre className="text-[#e2e8f0] text-sm font-mono whitespace-pre-wrap">{sqlQuery}</pre>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            1. Виконайте цей запит в базі даних
            <br />
            2. Збережіть результат у текстовий файл з роздільником табуляція (TSV)
            <br />
            3. Переконайтесь, що перший рядок містить заголовки колонок "id" та "art_num"
            <br />
            4. Файл повинен бути в кодуванні UTF-8
          </p>
        </div>

        <div className="bg-[#fff8e1] rounded-lg p-4">
          <h3 className="font-medium mb-2">Важливі примітки:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Підтримуються формати: JPG, PNG, GIF, WebP</li>
            <li>Максимальний розмір файлу: 5MB</li>
            <li>Файл відповідності повинен бути в кодуванні UTF-8</li>
            <li>Для файлів з номерами (наприклад, APAU0603-1.jpg) номер буде збережено в новому імені</li>
            <li>Програма автоматично обробляє файли з номерами (наприклад, APAU0603-1.jpg стане ID_1.jpg)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}