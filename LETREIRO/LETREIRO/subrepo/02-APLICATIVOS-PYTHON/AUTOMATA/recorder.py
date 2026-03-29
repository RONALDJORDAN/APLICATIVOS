import time
import json
from pynput import mouse, keyboard
import threading

class ActionRecorder:
    def __init__(self):
        self.actions = []
        self.start_time = 0
        self.is_recording = False
        self.mouse_listener = None
        self.keyboard_listener = None

    def start_recording(self):
        self.actions = []
        self.start_time = time.time()
        self.is_recording = True

        self.mouse_listener = mouse.Listener(
            on_move=self.on_move,
            on_click=self.on_click,
            on_scroll=self.on_scroll
        )
        self.keyboard_listener = keyboard.Listener(
            on_press=self.on_press,
            on_release=self.on_release
        )

        self.mouse_listener.start()
        self.keyboard_listener.start()
        
    def stop_recording(self):
        self.is_recording = False
        if self.mouse_listener:
            self.mouse_listener.stop()
        if self.keyboard_listener:
            self.keyboard_listener.stop()

    def get_time(self):
        return time.time() - self.start_time

    # Mouse Events
    def on_move(self, x, y):
        if not self.is_recording: return
        self.actions.append({
            'type': 'mouse_move',
            'time': self.get_time(),
            'x': x,
            'y': y
        })

    def on_click(self, x, y, button, pressed):
        if not self.is_recording: return
        self.actions.append({
            'type': 'mouse_click',
            'time': self.get_time(),
            'x': x,
            'y': y,
            'button': str(button),
            'pressed': pressed
        })

    def on_scroll(self, x, y, dx, dy):
        if not self.is_recording: return
        self.actions.append({
            'type': 'mouse_scroll',
            'time': self.get_time(),
            'x': x,
            'y': y,
            'dx': dx,
            'dy': dy
        })

    # Keyboard Events
    def on_press(self, key):
        if not self.is_recording: return
        try:
            k = key.char
        except AttributeError:
            k = str(key)
            
        self.actions.append({
            'type': 'keyboard_press',
            'time': self.get_time(),
            'key': k
        })

    def on_release(self, key):
        if not self.is_recording: return
        try:
            k = key.char
        except AttributeError:
            k = str(key)
            
        self.actions.append({
            'type': 'keyboard_release',
            'time': self.get_time(),
            'key': k
        })
        
    def save_to_file(self, filename):
        with open(filename, 'w') as f:
            json.dump(self.actions, f, indent=4)

    def load_from_file(self, filename):
        with open(filename, 'r') as f:
            self.actions = json.load(f)


class ActionPlayer:
    def __init__(self):
        self.mouse_controller = mouse.Controller()
        self.keyboard_controller = keyboard.Controller()
        self.is_playing = False
        self._play_thread = None

    def play_actions(self, actions_list, speed_multiplier=1.0, callback=None):
        if not actions_list: return
        
        self.is_playing = True
        self._play_thread = threading.Thread(
            target=self._play_loop, 
            args=(actions_list, speed_multiplier, callback),
            daemon=True
        )
        self._play_thread.start()

    def stop_playing(self):
        self.is_playing = False

    def _play_loop(self, actions_list, speed_multiplier, callback):
        # We need to sort by time just in case, though they should be sequential
        sorted_actions = sorted(actions_list, key=lambda x: x['time'])
        
        start_real_time = time.time()
        
        for i, action in enumerate(sorted_actions):
            if not self.is_playing:
                break
                
            # Calculate when this action should occur relative to the start
            target_time = start_real_time + (action['time'] / speed_multiplier)
            
            # Wait until it's time
            now = time.time()
            if target_time > now:
                time.sleep(target_time - now)
                
            if not self.is_playing:
                break

            self._execute_action(action)
            
        self.is_playing = False
        if callback:
            callback()

    def _execute_action(self, action):
        t = action['type']
        
        if t == 'mouse_move':
            self.mouse_controller.position = (action['x'], action['y'])
            
        elif t == 'mouse_click':
            # Convert string button back to enum
            btn_str = action['button'].replace('Button.', '')
            btn = getattr(mouse.Button, btn_str, mouse.Button.left)
            
            self.mouse_controller.position = (action['x'], action['y'])
            if action['pressed']:
                self.mouse_controller.press(btn)
            else:
                self.mouse_controller.release(btn)
                
        elif t == 'mouse_scroll':
            self.mouse_controller.position = (action['x'], action['y'])
            self.mouse_controller.scroll(action['dx'], action['dy'])
            
        elif t == 'keyboard_press':
            key = self._parse_key(action['key'])
            if key:
                self.keyboard_controller.press(key)
                
        elif t == 'keyboard_release':
            key = self._parse_key(action['key'])
            if key:
                self.keyboard_controller.release(key)

    def _parse_key(self, key_str):
        if not key_str:
            return None
        if key_str.startswith('Key.'):
            # Special key
            key_name = key_str.replace('Key.', '')
            return getattr(keyboard.Key, key_name, None)
        elif len(key_str) == 1:
            return key_str
        elif isinstance(key_str, str) and key_str.startswith("'") and key_str.endswith("'") and len(key_str) == 3:
             # handle formatted unprintable key character like "'\\x01'"
             return key_str.replace("'", "")
        return None
