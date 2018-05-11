<?php
   header("Access-Control-Allow-Origin: *");
   error_reporting(E_ALL);
		
	class BackgroundProcess{
		const OS_WINDOWS = 1;
		const OS_NIX     = 2;
		const OS_OTHER   = 3;
		private $command;
		private $pid;
		protected $serverOS;
		private $CurrentDirectory;
		public function __construct($command = null,$dir=''){
			$this->command  = $command;
			$this->serverOS = $this->getOS();
			$this->CurrentDirectory  =$dir ;
		}
		public function set_command($command){
			$this->command = $command;
		}
		public function set_CurrentDirectory($dir){
			$this->CurrentDirectory = $dir;
		}
		/**
		 * @param string $outputFile File to write the output of the process to; defaults to /dev/null
		 *                           currently $outputFile has no effect when used in conjunction with a Windows server
		 * @param bool $append - set to true if output should be appended to $outputfile
		 */
		public function run($outputFile = '/dev/null', $append = false){
			if($this->command === null) {
				return;
			}
			switch ($this->getOS()) {
				case self::OS_WINDOWS:
							//$cmd = 'wmic process call create "C:/xampp/php/php.exe -f /path/to/htdocs/test.php" | find "ProcessId"';
							$cmd = 'wmic process call create "'.$this->command.'" | find "ProcessId"';
							$handle = popen("start /B ". $cmd, "r");
							$read = fread($handle, 200); //Read the output 
							//echo $read; //Store the info//ProcessId = 8156;
							$pid=substr($read,strpos($read,'=')+1);
							$pid=substr($pid,0,strpos($pid,';') );
							//echo 'ProcessId : ' . $pid;
							$this->pid = (int)$pid;
							pclose($handle); //Close
					break;
				case self::OS_NIX:
					$this->pid = (int)shell_exec(sprintf('%s %s %s 2>&1 & echo $!', $this->command, ($append) ? '>>' : '>', $outputFile));
					break;
				default:
					throw new RuntimeException(sprintf(
						'Could not execute command "%s" because operating system "%s" is not supported by '.
						'Cocur\BackgroundProcess.',
						$this->command,
						PHP_OS
					));
			}
		}
		public function isRunning(){
			try {
				switch ($this->getOS()) {
					case self::OS_WINDOWS:
						//tasklist /FI "PID eq 6480"
						$result = shell_exec('tasklist /FI "PID eq '.$this->pid.'"' );
						if (count(preg_split("/\n/", $result)) > 0 && !preg_match('/No tasks/', $result)) {
							return true;
						}
					break;
					case self::OS_NIX:
					//pstree to list all process
						$result = shell_exec(sprintf('ps %d 2>&1', $this->pid));
						if (count(preg_split("/\n/", $result)) > 2 && !preg_match('/ERROR: Process ID out of range/', $result)) {
							return true;
						}
					break;	
				}
			} catch (Exception $e) {
			}
			return false;
		}
		public function stop(){
			try {
				switch ($this->getOS()) {
					case self::OS_WINDOWS:
						//taskkill /PID 9444
						$result = shell_exec('taskkill /PID '.$this->pid );
						if (count(preg_split("/\n/", $result)) > 0 && !preg_match('/No tasks/', $result)) {
							return true;
						}
					break;
					case self::OS_NIX:
						$result = shell_exec(sprintf('kill %d 2>&1', $this->pid));
						if (!preg_match('/No such process/', $result)) {
							return true;
						}
					break;	
				}
			} catch (Exception $e) {
			}
			return false;
		}
		public function getPid(){
			return $this->pid;
		}
		//protected function setPid($pid){
		public function setPid($pid){	
			//$this->checkSupportingOS('Cocur\BackgroundProcess can only return the PID of a process on *nix-based systems, '.
			//						 'such as Unix, Linux or Mac OS X. You are running "%s".');
			$this->pid = $pid;
		}
		protected function getOS(){
			$os = strtoupper(PHP_OS);
			if (substr($os, 0, 3) === 'WIN') {
				return self::OS_WINDOWS;
			} else if ($os === 'LINUX' || $os === 'FREEBSD' || $os === 'DARWIN') {
				return self::OS_NIX;
			}
			return self::OS_OTHER;
		}
		protected function checkSupportingOS($message){
			if ($this->getOS() !== self::OS_NIX) {
				throw new RuntimeException(sprintf($message, PHP_OS));
			}
		}
		static public function createFromPID($pid) {
			$process = new self();
			$process->setPid($pid);
			return $process;
		}
	}
		
		
	function run_process($cmd,$outputFile = '/dev/null', $append = false){
			$pid=0;
		if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {//'This is a server using Windows!';
				$cmd = 'wmic process call create "'.$cmd.'" | find "ProcessId"';
				$handle = popen("start /B ". $cmd, "r");
				$read = fread($handle, 200); //Read the output 
				$pid=substr($read,strpos($read,'=')+1);
				$pid=substr($pid,0,strpos($pid,';') );
				$pid = (int)$pid;
				pclose($handle); //Close
		}else{
			#echo sprintf('%s %s %s 2>&1 & echo $!', $cmd, ($append) ? '>>' : '>', $outputFile);
			$pid = (int)shell_exec(sprintf('%s %s %s 2>&1 & echo $!', $cmd, ($append) ? '>>' : '>', $outputFile));
		}
			return $pid;
	}
	function is_process_running($pid){
		if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {//'This is a server using Windows!';
				//tasklist /FI "PID eq 6480"
			$result = shell_exec('tasklist /FI "PID eq '.$pid.'"' );
			if (count(preg_split("/\n/", $result)) > 0 && !preg_match('/No tasks/', $result)) {
				return true;
			}
		}else{
			$result = shell_exec(sprintf('ps %d 2>&1', $pid));
			if (count(preg_split("/\n/", $result)) > 2 && !preg_match('/ERROR: Process ID out of range/', $result)) {
				return true;
			}
		}
		return false;
	}
	function stop_process($pid){
			if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {//'This is a server using Windows!';
					$result = shell_exec('taskkill /PID '.$pid );
				if (count(preg_split("/\n/", $result)) > 0 && !preg_match('/No tasks/', $result)) {
					return true;
				}
			}else{
					$result = shell_exec(sprintf('kill %d 2>&1', $pid));
				if (!preg_match('/No such process/', $result)) {
					return true;
				}
			}
	}
	
	
   $type = $_GET["type"];

	switch($type){
		case 'start':
			$sts = $_GET["sts"];
			if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {//'This is a server using Windows!';
				//$cmd = "c:\\ffmpeg\\bin\\ffmpeg.exe -re -y -i 320240.mp4 -vcodec libx264 -f flv rtmp://{$sts}.perfectomobile.com/live/conTest ";
				$cmd = "cmd /C c:\\ffmpeg\\startStream {$sts}";
			}else{
				#$cmd = "ffmpeg -re -y -i \"../320240.mp4\" -vcodec libx264 -f flv \"rtmp://{$sts}.perfectomobile.com/live/conTest\" ";
				$cmd= "../startStream.sh {$sts}";
			}
		   echo run_process($cmd);
			break;
		case 'check':
			$pid = $_GET["pid"];
			if($pid!=0){
				if(is_process_running($pid)){
					echo 'Process running';
				}else{
					echo 'Process not running';
				}
			}
			break;
		case 'stop':
			$pid = $_GET["pid"];
			if($pid!=0){
				if(is_process_running($pid)){
					stop_process($pid);
					 echo 'Process stopped';
				}else{
					echo 'Process not running';
				}
			}	 
			break;
	}
	exit;
?>
