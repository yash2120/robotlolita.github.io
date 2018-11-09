function randint(start, end) {
  return start + Math.floor(Math.random() * (end - start));
}

class EOFError extends Error {}
const readline = require("readline");
function read(k) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.once("line", line => {
    rl.close();
    k(null, line);
  });
  rl.once("SIGINT", () => {
    rl.close();
    k(new EOFError(`Received SIGINT`));
  });
  rl.prompt();
}

console.log("Guess the number!");
const secret_number = randint(1, 101);

function loop() {
  console.log("Please input your guess: ");
  read((error, guess_string) => {
    if (error) {
      console.error(error);
    } else {
      const guess = Number(guess_string);

      if (guess < secret_number) {
        console.log("Too small!");
        loop();
      } else if (guess > secret_number) {
        console.log("Too big!");
        loop();
      } else {
        console.log("You win!");
      }
    }
  });
}

loop();
