const { test, expect } = require('@playwright/test');

test('add todo', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');
  
  // Find the new todo input and add a task
  const newTodo = page.locator('.new-todo');
  await newTodo.fill('Test task from Playwright');
  await newTodo.press('Enter');
  
  // Verify the task appeared in the list
  const todoList = page.locator('.todo-list li');
  await expect(todoList).toHaveCount(1);
  await expect(todoList).toContainText('Test task from Playwright');
  
  console.log('Todo added successfully!');
});