import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  filtroGenero: string = '';
  filtroNombre: string = '';
  filtroLanzamiento: number | null = null;
  resultadosEncontrados: boolean = true;
  originalPeliculas: any[] = [];

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs as any;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.originalPeliculas = [...data]; // Crear una copia del arreglo original
    });
  }

  generarPDF() {
    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            ['Título', 'Género', 'Año de lanzamiento'],
            ...this.peliculas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
          ]
        }
      }
    ];

    const estilos: any = {
      header: {
        fontSize: 22,
        bold: true,
        color: '#4a90e2', // Azul real
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      table: {
        margin: [0, 10, 0, 0],
        fontSize: 14,
        color: '#333',
        header: {
          bold: true,
          fontSize: 16,
          color: '#fff',
          fillColor: '#4a90e2' // Azul real
        }
      }
    };

    const documentDefinition = {
      content: contenido,
      styles: estilos
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  exportarCSV() {
    const csvData = this.peliculas.map(pelicula => ({
      titulo: pelicula.titulo,
      genero: pelicula.genero,
      lanzamiento: pelicula.lanzamiento
    }));

    const csvContent = '\ufeff' + this.convertToCSV(csvData);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'informe-peliculas.csv');
  }

  private convertToCSV(data: any[]): string {
    const header = Object.keys(data[0]);
    const csv = [
      header.join(','),
      ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName])).join(','))
    ];
    return csv.join('\n');
  }

  exportarJSON() {
    const jsonContent = JSON.stringify(this.peliculas, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    saveAs(blob, 'informe-peliculas.json');
  }

  exportarXML() {
    const xmlContent = this.convertToXML(this.peliculas);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    saveAs(blob, 'informe-peliculas.xml');
  }

  convertToXML(data: any[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8" ?>';
    const xmlBody = data.map(item => {
      const properties = Object.entries(item).map(([key, value]) => `<${key}>${value}</${key}>`).join('');
      return `<item>${properties}</item>`;
    }).join('');

    return `${xmlHeader}<items>${xmlBody}</items>`;
  }


  aplicarFiltros() {
    this.peliculas = this.originalPeliculas.filter(pelicula =>
      (this.filtroGenero === '' || pelicula.genero.toLowerCase().includes(this.filtroGenero.toLowerCase())) &&
      (this.filtroNombre === '' || pelicula.titulo.toLowerCase().includes(this.filtroNombre.toLowerCase())) &&
      (this.filtroLanzamiento === null || pelicula.lanzamiento === this.filtroLanzamiento)
    );

    this.resultadosEncontrados = this.peliculas.length > 0;
  }

  resetearFiltros() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.originalPeliculas = [...data]; // Crear una copia del arreglo original
      this.filtroGenero = '';
      this.filtroNombre = '';
      this.filtroLanzamiento = null;
      this.resultadosEncontrados = true;
    });
  }
}
