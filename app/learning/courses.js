/* Offline curriculum: explanations, quizzes, executable exercises and reference solutions. */
(function(root){const courses=[
  {
    "id": "c",
    "title": "C",
    "subtitle": "Explore the foundations. Control memory.",
    "icon": "C",
    "lessons": [
      {
        "id": "c-1",
        "title": "First signal",
        "topic": "Output",
        "explanation": "A program follows instructions in order. Output sends text to the console. Exact spelling matters; a newline separates lines.",
        "task": "Print Hello, explorer! on its own line.",
        "question": "Which action displays a message?",
        "options": [
          "Output",
          "Variable declaration",
          "A comment"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "",
            "output": "Hello, explorer!"
          }
        ],
        "solution": "#include <stdio.h>\nint main() {\n    printf(\"Hello, explorer!\\n\");\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Print Hello, explorer! on its own line.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "c-2",
        "title": "Supply station",
        "topic": "Variables",
        "explanation": "Variables give names to values. An integer stores whole numbers. Updating a variable changes its value; it does not change earlier output.",
        "task": "Create a variable named supplies with value 12, add 8, and print its value.",
        "question": "After x starts at 12 and increases by 8, what is x?",
        "options": [
          "12",
          "20",
          "8"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "",
            "output": "20"
          }
        ],
        "solution": "#include <stdio.h>\nint main() {\n    int supplies = 12; supplies += 8; printf(\"%d\\n\", supplies);\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Create a variable named supplies with value 12, add 8, and print its value.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "c-3",
        "title": "Decode the gate",
        "topic": "Input",
        "explanation": "Input arrives as text. Read or convert it into the numeric type you need. The Input panel supplies all values before execution.",
        "task": "Read two integers and print their sum. The values may be negative.",
        "question": "Why convert input text to an integer?",
        "options": [
          "To change its color",
          "To end the program",
          "To calculate numerically"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "7 5",
            "output": "12"
          },
          {
            "input": "-8 3",
            "output": "-5"
          }
        ],
        "solution": "#include <stdio.h>\nint main() {\n    int a, b; scanf(\"%d %d\", &a, &b); printf(\"%d\\n\", a + b);\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Read two integers and print their sum. The values may be negative.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "c-4",
        "title": "Choose a route",
        "topic": "Conditions",
        "explanation": "A condition evaluates to true or false. Use if and else to choose one branch. The remainder operator % helps test divisibility.",
        "task": "Read an integer. Print even when it is divisible by 2; otherwise print odd.",
        "question": "Which expression tests whether n is even?",
        "options": [
          "n % 2 == 0",
          "n + 2 == 0",
          "n > 2"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "8",
            "output": "even"
          },
          {
            "input": "7",
            "output": "odd"
          },
          {
            "input": "-4",
            "output": "even"
          }
        ],
        "solution": "#include <stdio.h>\nint main() {\n    int n; scanf(\"%d\", &n); printf(\"%s\\n\", n % 2 == 0 ? \"even\" : \"odd\");\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Read an integer. Print even when it is divisible by 2; otherwise print odd.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "c-5",
        "title": "Climb the tower",
        "topic": "Loops",
        "explanation": "A loop repeats a block. Start with an accumulator of zero and add each integer from 1 through n. Check your end condition to avoid missing n.",
        "task": "Read n (1 to 100). Print the sum of integers 1 through n.",
        "question": "Why initialize the sum to zero?",
        "options": [
          "It stops every loop",
          "It is the neutral starting value for addition",
          "It skips the first number"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "5",
            "output": "15"
          },
          {
            "input": "1",
            "output": "1"
          },
          {
            "input": "10",
            "output": "55"
          }
        ],
        "solution": "#include <stdio.h>\nint main() {\n    int n, total = 0; scanf(\"%d\", &n); for(int i=1; i<=n; i++) total += i; printf(\"%d\\n\", total);\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Read n (1 to 100). Print the sum of integers 1 through n.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "c-6",
        "title": "Build a tool",
        "topic": "Functions",
        "explanation": "A function packages a reusable operation. Parameters are inputs; a return value is the result. Returning and printing are different operations.",
        "task": "Define a function square(n). Read an integer and print the value returned by square.",
        "question": "What does return do?",
        "options": [
          "Repeats a function",
          "Prints every variable",
          "Sends a result to the caller"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "7",
            "output": "49"
          },
          {
            "input": "-3",
            "output": "9"
          },
          {
            "input": "0",
            "output": "0"
          }
        ],
        "solution": "#include <stdio.h>\nint square(int n) { return n*n; }\nint main() {\n    int n; scanf(\"%d\", &n); printf(\"%d\\n\", square(n));\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Define a function square(n). Read an integer and print the value returned by square.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "c-7",
        "title": "Inventory scan",
        "topic": "Collections",
        "explanation": "A collection stores several values. To find a maximum, begin with its first item and compare the rest. Beginning at zero fails for all-negative values.",
        "task": "Read exactly five integers and print the largest one.",
        "question": "For negative-only inputs, what is a safe initial maximum?",
        "options": [
          "The first input value",
          "Always zero",
          "Always one"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "4 9 2 8 1",
            "output": "9"
          },
          {
            "input": "-4 -9 -2 -8 -1",
            "output": "-1"
          }
        ],
        "solution": "#include <stdio.h>\nint main() {\n    int a[5]; for(int i=0;i<5;i++) scanf(\"%d\", &a[i]); int largest=a[0]; for(int i=1;i<5;i++) if(a[i]>largest) largest=a[i]; printf(\"%d\\n\",largest);\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Read exactly five integers and print the largest one.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "c-8",
        "title": "Message vault",
        "topic": "Strings",
        "explanation": "A string is a sequence of characters. Walk through characters and count matches. This exercise uses one lowercase word, so spaces and uppercase letters are outside its input contract.",
        "task": "Read a lowercase word. Count a, e, i, o, and u, then print the count.",
        "question": "Which input has two vowels?",
        "options": [
          "sky",
          "code",
          "rhythm"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "code",
            "output": "2"
          },
          {
            "input": "rhythm",
            "output": "0"
          },
          {
            "input": "adventure",
            "output": "4"
          }
        ],
        "solution": "#include <stdio.h>\nint main() {\n    char word[101]; scanf(\"%100s\", word); int count=0; for(int i=0;word[i];i++) if(word[i]=='a'||word[i]=='e'||word[i]=='i'||word[i]=='o'||word[i]=='u') count++; printf(\"%d\\n\",count);\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Read a lowercase word. Count a, e, i, o, and u, then print the count.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "c-9",
        "title": "Recursive stairs",
        "topic": "Recursion",
        "explanation": "A recursive function calls itself on a smaller problem. A base case stops the calls. Factorial is n times factorial(n - 1), with factorial(0) equal to 1.",
        "task": "Use a recursive factorial function. Read n (0 to 10) and print n factorial.",
        "question": "What happens without a reachable base case?",
        "options": [
          "The result is always zero",
          "It automatically sorts",
          "Calls continue until a runtime limit is reached"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "5",
            "output": "120"
          },
          {
            "input": "0",
            "output": "1"
          },
          {
            "input": "8",
            "output": "40320"
          }
        ],
        "solution": "#include <stdio.h>\nint factorial(int n) { return n==0 ? 1 : n*factorial(n-1); }\nint main() {\n    int n; scanf(\"%d\", &n); printf(\"%d\\n\", factorial(n));\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Use a recursive factorial function. Read n (0 to 10) and print n factorial.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Advanced",
        "xp": 90
      },
      {
        "id": "c-10",
        "title": "Ordered cargo",
        "topic": "Algorithms",
        "explanation": "Sorting arranges values in order. Selection sort repeatedly finds the smallest remaining value. Standard libraries offer tested sorting operations too.",
        "task": "Read five integers and print them in ascending order, separated by spaces.",
        "question": "What is ascending order?",
        "options": [
          "Smallest to largest",
          "Largest to smallest",
          "Original input order"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "9 2 7 1 4",
            "output": "1 2 4 7 9"
          },
          {
            "input": "0 -2 0 8 -9",
            "output": "-9 -2 0 0 8"
          }
        ],
        "solution": "#include <stdio.h>\nint main() {\n    int a[5]; for(int i=0;i<5;i++) scanf(\"%d\", &a[i]); for(int i=0;i<5;i++) for(int j=i+1;j<5;j++) if(a[j]<a[i]) {int t=a[i];a[i]=a[j];a[j]=t;} for(int i=0;i<5;i++) printf(\"%d \",a[i]);\n    return 0;\n}\n",
        "starter": "#include <stdio.h>\n\n// Read five integers and print them in ascending order, separated by spaces.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Advanced",
        "xp": 90
      },
      {
        "id": "c-11",
        "title": "Memory outpost",
        "topic": "Pointers & structs",
        "explanation": "A struct groups related fields. A pointer holds an address; -> accesses a field through that pointer. Keep pointers within the lifetime of the object they refer to.",
        "task": "Define a struct Player with integer health. Read health and damage. Use a pointer to update health, clamping at zero, and print the result.",
        "question": "Which operator accesses a struct member through a pointer?",
        "options": [
          "->",
          "%",
          "&&"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "100 30",
            "output": "70"
          },
          {
            "input": "20 50",
            "output": "0"
          },
          {
            "input": "40 0",
            "output": "40"
          }
        ],
        "solution": "#include <stdio.h>\nstruct Player { int health; };\nint main(){struct Player p; int damage; scanf(\"%d %d\", &p.health, &damage); struct Player *ptr=&p; ptr->health -= damage; if(ptr->health<0) ptr->health=0; printf(\"%d\\n\",ptr->health);return 0;}",
        "starter": "// Define a struct Player with integer health. Read health and damage. Use a pointer to update health, clamping at zero, and print the result.\n",
        "stage": "Advanced",
        "xp": 120
      }
    ]
  },
  {
    "id": "cpp",
    "title": "C++",
    "subtitle": "Build with modern collections and abstractions.",
    "icon": "C++",
    "lessons": [
      {
        "id": "cpp-1",
        "title": "First signal",
        "topic": "Output",
        "explanation": "A program follows instructions in order. Output sends text to the console. Exact spelling matters; a newline separates lines.",
        "task": "Print Hello, explorer! on its own line.",
        "question": "Which action displays a message?",
        "options": [
          "Output",
          "Variable declaration",
          "A comment"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "",
            "output": "Hello, explorer!"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint main() {\n    cout << \"Hello, explorer!\\n\";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Print Hello, explorer! on its own line.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "cpp-2",
        "title": "Supply station",
        "topic": "Variables",
        "explanation": "Variables give names to values. An integer stores whole numbers. Updating a variable changes its value; it does not change earlier output.",
        "task": "Create a variable named supplies with value 12, add 8, and print its value.",
        "question": "After x starts at 12 and increases by 8, what is x?",
        "options": [
          "12",
          "20",
          "8"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "",
            "output": "20"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint main() {\n    int supplies = 12; supplies += 8; cout << supplies << \"\\n\";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Create a variable named supplies with value 12, add 8, and print its value.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "cpp-3",
        "title": "Decode the gate",
        "topic": "Input",
        "explanation": "Input arrives as text. Read or convert it into the numeric type you need. The Input panel supplies all values before execution.",
        "task": "Read two integers and print their sum. The values may be negative.",
        "question": "Why convert input text to an integer?",
        "options": [
          "To change its color",
          "To end the program",
          "To calculate numerically"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "7 5",
            "output": "12"
          },
          {
            "input": "-8 3",
            "output": "-5"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint main() {\n    int a,b; cin >> a >> b; cout << a+b << \"\\n\";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Read two integers and print their sum. The values may be negative.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "cpp-4",
        "title": "Choose a route",
        "topic": "Conditions",
        "explanation": "A condition evaluates to true or false. Use if and else to choose one branch. The remainder operator % helps test divisibility.",
        "task": "Read an integer. Print even when it is divisible by 2; otherwise print odd.",
        "question": "Which expression tests whether n is even?",
        "options": [
          "n % 2 == 0",
          "n + 2 == 0",
          "n > 2"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "8",
            "output": "even"
          },
          {
            "input": "7",
            "output": "odd"
          },
          {
            "input": "-4",
            "output": "even"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint main() {\n    int n; cin >> n; cout << (n%2==0 ? \"even\" : \"odd\") << \"\\n\";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Read an integer. Print even when it is divisible by 2; otherwise print odd.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "cpp-5",
        "title": "Climb the tower",
        "topic": "Loops",
        "explanation": "A loop repeats a block. Start with an accumulator of zero and add each integer from 1 through n. Check your end condition to avoid missing n.",
        "task": "Read n (1 to 100). Print the sum of integers 1 through n.",
        "question": "Why initialize the sum to zero?",
        "options": [
          "It stops every loop",
          "It is the neutral starting value for addition",
          "It skips the first number"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "5",
            "output": "15"
          },
          {
            "input": "1",
            "output": "1"
          },
          {
            "input": "10",
            "output": "55"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint main() {\n    int n,total=0; cin >> n; for(int i=1;i<=n;i++) total+=i; cout << total << \"\\n\";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Read n (1 to 100). Print the sum of integers 1 through n.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "cpp-6",
        "title": "Build a tool",
        "topic": "Functions",
        "explanation": "A function packages a reusable operation. Parameters are inputs; a return value is the result. Returning and printing are different operations.",
        "task": "Define a function square(n). Read an integer and print the value returned by square.",
        "question": "What does return do?",
        "options": [
          "Repeats a function",
          "Prints every variable",
          "Sends a result to the caller"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "7",
            "output": "49"
          },
          {
            "input": "-3",
            "output": "9"
          },
          {
            "input": "0",
            "output": "0"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint square(int n) { return n*n; }\nint main() {\n    int n; cin >> n; cout << square(n) << \"\\n\";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Define a function square(n). Read an integer and print the value returned by square.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "cpp-7",
        "title": "Inventory scan",
        "topic": "Collections",
        "explanation": "A collection stores several values. To find a maximum, begin with its first item and compare the rest. Beginning at zero fails for all-negative values.",
        "task": "Read exactly five integers and print the largest one.",
        "question": "For negative-only inputs, what is a safe initial maximum?",
        "options": [
          "The first input value",
          "Always zero",
          "Always one"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "4 9 2 8 1",
            "output": "9"
          },
          {
            "input": "-4 -9 -2 -8 -1",
            "output": "-1"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint main() {\n    vector<int> a(5); for(int &n:a) cin >> n; cout << *max_element(a.begin(),a.end()) << \"\\n\";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Read exactly five integers and print the largest one.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "cpp-8",
        "title": "Message vault",
        "topic": "Strings",
        "explanation": "A string is a sequence of characters. Walk through characters and count matches. This exercise uses one lowercase word, so spaces and uppercase letters are outside its input contract.",
        "task": "Read a lowercase word. Count a, e, i, o, and u, then print the count.",
        "question": "Which input has two vowels?",
        "options": [
          "sky",
          "code",
          "rhythm"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "code",
            "output": "2"
          },
          {
            "input": "rhythm",
            "output": "0"
          },
          {
            "input": "adventure",
            "output": "4"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint main() {\n    string word; cin >> word; int count=0; for(char ch:word) if(string(\"aeiou\").find(ch)!=string::npos) count++; cout << count << \"\\n\";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Read a lowercase word. Count a, e, i, o, and u, then print the count.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "cpp-9",
        "title": "Recursive stairs",
        "topic": "Recursion",
        "explanation": "A recursive function calls itself on a smaller problem. A base case stops the calls. Factorial is n times factorial(n - 1), with factorial(0) equal to 1.",
        "task": "Use a recursive factorial function. Read n (0 to 10) and print n factorial.",
        "question": "What happens without a reachable base case?",
        "options": [
          "The result is always zero",
          "It automatically sorts",
          "Calls continue until a runtime limit is reached"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "5",
            "output": "120"
          },
          {
            "input": "0",
            "output": "1"
          },
          {
            "input": "8",
            "output": "40320"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint factorial(int n) { return n==0 ? 1 : n*factorial(n-1); }\nint main() {\n    int n; cin >> n; cout << factorial(n) << \"\\n\";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Use a recursive factorial function. Read n (0 to 10) and print n factorial.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Advanced",
        "xp": 90
      },
      {
        "id": "cpp-10",
        "title": "Ordered cargo",
        "topic": "Algorithms",
        "explanation": "Sorting arranges values in order. Selection sort repeatedly finds the smallest remaining value. Standard libraries offer tested sorting operations too.",
        "task": "Read five integers and print them in ascending order, separated by spaces.",
        "question": "What is ascending order?",
        "options": [
          "Smallest to largest",
          "Largest to smallest",
          "Original input order"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "9 2 7 1 4",
            "output": "1 2 4 7 9"
          },
          {
            "input": "0 -2 0 8 -9",
            "output": "-9 -2 0 0 8"
          }
        ],
        "solution": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint main() {\n    vector<int> a(5); for(int &n:a) cin >> n; sort(a.begin(),a.end()); for(int n:a) cout << n << \" \";\n    return 0;\n}\n",
        "starter": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\n// Read five integers and print them in ascending order, separated by spaces.\nint main() {\n    // Your code here\n    return 0;\n}\n",
        "stage": "Advanced",
        "xp": 90
      },
      {
        "id": "cpp-11",
        "title": "Guardian class",
        "topic": "Classes & encapsulation",
        "explanation": "A class combines data and behavior. Private data is accessed through public methods. A constructor initializes each instance. This makes rules such as health never below zero reusable.",
        "task": "Define a Player class with private health and a damage method. Read initial health and damage; print the remaining health clamped at zero.",
        "question": "Why make health private?",
        "options": [
          "To increase its value",
          "To control updates through the class interface",
          "To print it automatically"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "100 30",
            "output": "70"
          },
          {
            "input": "20 50",
            "output": "0"
          },
          {
            "input": "40 0",
            "output": "40"
          }
        ],
        "solution": "#include <iostream>\n#include <algorithm>\nclass Player {int health; public: Player(int h):health(h){} void damage(int d){health=std::max(0,health-d);} int remaining() const{return health;}};\nint main(){int h,d;std::cin>>h>>d;Player p(h);p.damage(d);std::cout<<p.remaining();}",
        "starter": "// Define a Player class with private health and a damage method. Read initial health and damage; print the remaining health clamped at zero.\n",
        "stage": "Advanced",
        "xp": 120
      }
    ]
  },
  {
    "id": "py",
    "title": "Python",
    "subtitle": "Turn ideas into expressive programs.",
    "icon": "Py",
    "lessons": [
      {
        "id": "py-1",
        "title": "First signal",
        "topic": "Output",
        "explanation": "A program follows instructions in order. Output sends text to the console. Exact spelling matters; a newline separates lines.",
        "task": "Print Hello, explorer! on its own line.",
        "question": "Which action displays a message?",
        "options": [
          "Output",
          "Variable declaration",
          "A comment"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "",
            "output": "Hello, explorer!"
          }
        ],
        "solution": "print(\"Hello, explorer!\")\n",
        "starter": "# Print Hello, explorer! on its own line.\n# Write your solution below.\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "py-2",
        "title": "Supply station",
        "topic": "Variables",
        "explanation": "Variables give names to values. An integer stores whole numbers. Updating a variable changes its value; it does not change earlier output.",
        "task": "Create a variable named supplies with value 12, add 8, and print its value.",
        "question": "After x starts at 12 and increases by 8, what is x?",
        "options": [
          "12",
          "20",
          "8"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "",
            "output": "20"
          }
        ],
        "solution": "supplies = 12\nsupplies += 8\nprint(supplies)\n",
        "starter": "# Create a variable named supplies with value 12, add 8, and print its value.\n# Write your solution below.\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "py-3",
        "title": "Decode the gate",
        "topic": "Input",
        "explanation": "Input arrives as text. Read or convert it into the numeric type you need. The Input panel supplies all values before execution.",
        "task": "Read two integers and print their sum. The values may be negative.",
        "question": "Why convert input text to an integer?",
        "options": [
          "To change its color",
          "To end the program",
          "To calculate numerically"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "7 5",
            "output": "12"
          },
          {
            "input": "-8 3",
            "output": "-5"
          }
        ],
        "solution": "a, b = map(int, input().split())\nprint(a + b)\n",
        "starter": "# Read two integers and print their sum. The values may be negative.\n# Write your solution below.\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "py-4",
        "title": "Choose a route",
        "topic": "Conditions",
        "explanation": "A condition evaluates to true or false. Use if and else to choose one branch. The remainder operator % helps test divisibility.",
        "task": "Read an integer. Print even when it is divisible by 2; otherwise print odd.",
        "question": "Which expression tests whether n is even?",
        "options": [
          "n % 2 == 0",
          "n + 2 == 0",
          "n > 2"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "8",
            "output": "even"
          },
          {
            "input": "7",
            "output": "odd"
          },
          {
            "input": "-4",
            "output": "even"
          }
        ],
        "solution": "n = int(input())\nprint(\"even\" if n % 2 == 0 else \"odd\")\n",
        "starter": "# Read an integer. Print even when it is divisible by 2; otherwise print odd.\n# Write your solution below.\n",
        "stage": "Foundations",
        "xp": 40
      },
      {
        "id": "py-5",
        "title": "Climb the tower",
        "topic": "Loops",
        "explanation": "A loop repeats a block. Start with an accumulator of zero and add each integer from 1 through n. Check your end condition to avoid missing n.",
        "task": "Read n (1 to 100). Print the sum of integers 1 through n.",
        "question": "Why initialize the sum to zero?",
        "options": [
          "It stops every loop",
          "It is the neutral starting value for addition",
          "It skips the first number"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "5",
            "output": "15"
          },
          {
            "input": "1",
            "output": "1"
          },
          {
            "input": "10",
            "output": "55"
          }
        ],
        "solution": "n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)\n",
        "starter": "# Read n (1 to 100). Print the sum of integers 1 through n.\n# Write your solution below.\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "py-6",
        "title": "Build a tool",
        "topic": "Functions",
        "explanation": "A function packages a reusable operation. Parameters are inputs; a return value is the result. Returning and printing are different operations.",
        "task": "Define a function square(n). Read an integer and print the value returned by square.",
        "question": "What does return do?",
        "options": [
          "Repeats a function",
          "Prints every variable",
          "Sends a result to the caller"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "7",
            "output": "49"
          },
          {
            "input": "-3",
            "output": "9"
          },
          {
            "input": "0",
            "output": "0"
          }
        ],
        "solution": "def square(n):\n    return n * n\nn = int(input())\nprint(square(n))\n",
        "starter": "# Define a function square(n). Read an integer and print the value returned by square.\n# Write your solution below.\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "py-7",
        "title": "Inventory scan",
        "topic": "Collections",
        "explanation": "A collection stores several values. To find a maximum, begin with its first item and compare the rest. Beginning at zero fails for all-negative values.",
        "task": "Read exactly five integers and print the largest one.",
        "question": "For negative-only inputs, what is a safe initial maximum?",
        "options": [
          "The first input value",
          "Always zero",
          "Always one"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "4 9 2 8 1",
            "output": "9"
          },
          {
            "input": "-4 -9 -2 -8 -1",
            "output": "-1"
          }
        ],
        "solution": "values = list(map(int, input().split()))\nprint(max(values))\n",
        "starter": "# Read exactly five integers and print the largest one.\n# Write your solution below.\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "py-8",
        "title": "Message vault",
        "topic": "Strings",
        "explanation": "A string is a sequence of characters. Walk through characters and count matches. This exercise uses one lowercase word, so spaces and uppercase letters are outside its input contract.",
        "task": "Read a lowercase word. Count a, e, i, o, and u, then print the count.",
        "question": "Which input has two vowels?",
        "options": [
          "sky",
          "code",
          "rhythm"
        ],
        "answer": 1,
        "cases": [
          {
            "input": "code",
            "output": "2"
          },
          {
            "input": "rhythm",
            "output": "0"
          },
          {
            "input": "adventure",
            "output": "4"
          }
        ],
        "solution": "word = input()\ncount = 0\nfor ch in word:\n    if ch in \"aeiou\":\n        count += 1\nprint(count)\n",
        "starter": "# Read a lowercase word. Count a, e, i, o, and u, then print the count.\n# Write your solution below.\n",
        "stage": "Explorer",
        "xp": 60
      },
      {
        "id": "py-9",
        "title": "Recursive stairs",
        "topic": "Recursion",
        "explanation": "A recursive function calls itself on a smaller problem. A base case stops the calls. Factorial is n times factorial(n - 1), with factorial(0) equal to 1.",
        "task": "Use a recursive factorial function. Read n (0 to 10) and print n factorial.",
        "question": "What happens without a reachable base case?",
        "options": [
          "The result is always zero",
          "It automatically sorts",
          "Calls continue until a runtime limit is reached"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "5",
            "output": "120"
          },
          {
            "input": "0",
            "output": "1"
          },
          {
            "input": "8",
            "output": "40320"
          }
        ],
        "solution": "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\nn = int(input())\nprint(factorial(n))\n",
        "starter": "# Use a recursive factorial function. Read n (0 to 10) and print n factorial.\n# Write your solution below.\n",
        "stage": "Advanced",
        "xp": 90
      },
      {
        "id": "py-10",
        "title": "Ordered cargo",
        "topic": "Algorithms",
        "explanation": "Sorting arranges values in order. Selection sort repeatedly finds the smallest remaining value. Standard libraries offer tested sorting operations too.",
        "task": "Read five integers and print them in ascending order, separated by spaces.",
        "question": "What is ascending order?",
        "options": [
          "Smallest to largest",
          "Largest to smallest",
          "Original input order"
        ],
        "answer": 0,
        "cases": [
          {
            "input": "9 2 7 1 4",
            "output": "1 2 4 7 9"
          },
          {
            "input": "0 -2 0 8 -9",
            "output": "-9 -2 0 0 8"
          }
        ],
        "solution": "values = list(map(int, input().split()))\nprint(*sorted(values))\n",
        "starter": "# Read five integers and print them in ascending order, separated by spaces.\n# Write your solution below.\n",
        "stage": "Advanced",
        "xp": 90
      },
      {
        "id": "py-11",
        "title": "Guardian class",
        "topic": "Classes & state",
        "explanation": "An object groups state with behavior. __init__ initializes an instance; self refers to that instance. Methods can enforce rules whenever they update state.",
        "task": "Define a Player class with health and a damage method. Read initial health and damage; print the remaining health clamped at zero.",
        "question": "What does self refer to?",
        "options": [
          "The input stream",
          "Every class at once",
          "The current instance"
        ],
        "answer": 2,
        "cases": [
          {
            "input": "100 30",
            "output": "70"
          },
          {
            "input": "20 50",
            "output": "0"
          },
          {
            "input": "40 0",
            "output": "40"
          }
        ],
        "solution": "class Player:\n    def __init__(self, health):\n        self.health = health\n    def damage(self, amount):\n        self.health = max(0, self.health - amount)\nh, d = map(int, input().split())\np = Player(h)\np.damage(d)\nprint(p.health)\n",
        "starter": "# Define a Player class with health and a damage method. Read initial health and damage; print the remaining health clamped at zero.\n",
        "stage": "Advanced",
        "xp": 120
      }
    ]
  }
]; if(typeof module!=="undefined")module.exports=courses;else root.CBCourses=courses;})(globalThis);
