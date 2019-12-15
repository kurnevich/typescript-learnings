class Student {
    fullName: string;
    constructor(
      public firstName: string,
      public middleInitial: string,
      public lastName: string) {
        this.fullName = firstName + " " + middleInitial + " " + lastName;
    }
}

interface Person {
    firstName: string;
    fullName: string;
}

function greeter(person: Person) {
    return `Hello, ${person.firstName} (${person.fullName})`;
}

const user = new Student("Jane", "J.", "Smith");

document.body.textContent = greeter(user);
