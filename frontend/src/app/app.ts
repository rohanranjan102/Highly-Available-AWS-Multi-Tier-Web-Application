import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentService } from './student.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  studentName: string = '';
  studentClass: string = '';
  subject: string = '';

  students: any[] = [];

  submitted: boolean = false;

  constructor(private studentService: StudentService) {}

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.studentService.getStudents().subscribe({
      next: (data: any) => {
        this.students = data;
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  addStudent() {

    this.submitted = true;

    if (
      this.studentName.trim() === '' ||
      this.studentClass.trim() === '' ||
      this.subject.trim() === ''
    ) {
      return;
    }

    const student = {
      name: this.studentName,
      student_class: this.studentClass,
      subject: this.subject
    };

    this.studentService.addStudent(student).subscribe({
      next: (data: any) => {

        this.students.push(data);

        this.studentName = '';
        this.studentClass = '';
        this.subject = '';

        this.submitted = false;
      },

      error: (error) => {
        console.error('Error adding student:', error);
      }
    });
  }
}