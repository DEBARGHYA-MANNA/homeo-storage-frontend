import Papa from "papaparse";

// Parse CSV file to array of objects
export const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            trimHeaders: true,
            transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ""),
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn("CSV Parse Warnings:", results.errors);
                }
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            },
        });
    });
};

// Convert array of objects to CSV string (for template download)
export const generateCSVTemplate = (columns) => {
    const headers = columns.map((col) => col.label);
    const exampleRow = columns.map((col) => col.example || "");
    const csv = [headers.join(","), exampleRow.join(",")].join("\n");
    return csv;
};

// Download CSV template file
export const downloadTemplate = (columns, filename) => {
    const csv = generateCSVTemplate(columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_template.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
};