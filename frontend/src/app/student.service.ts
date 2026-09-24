import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  getStudents() {
    return this.http.get(`${this.apiUrl}/students`);
  }

  addStudent(student: any) {
    return this.http.post(`${this.apiUrl}/students`, student);
  }
}
