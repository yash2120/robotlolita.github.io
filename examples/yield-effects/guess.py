import random

print("Guess the number!")
secret_number = random.randint(1, 101)

while True:
  guess = int(input("Please input your guess: "))
  print("You guessed: " + str(guess))

  if guess < secret_number:
    print("Too small!")
  elif guess > secret_number:
    print("Too big!")
  else:
    print("You win!")
    break